"""Offline answer evaluation. Python 3.13; standard library only; no model/API calls.

Gold section annotations are a reproducible support proxy, not an entailment oracle.
Keep reserved labels out of prediction and application imports.
"""
import argparse
import json
import math
from pathlib import Path


def wilson(successes, total):
    if not total:
        return None
    z = 1.959963984540054
    p = successes / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    radius = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return [max(0, center - radius), min(1, center + radius)]


def passages(policy):
    """Independently reconstruct stored extraction units / blank-line TXT references."""
    extraction = policy.get('extraction')
    if extraction:
        for unit in extraction['units']:
            if not unit['text'].strip():
                continue
            text = unit['text']
            end = len(text.replace('\r\n', '\n').replace('\r', '\n').split('\n'))
            yield dict(passageId=f"{policy['id']}:{extraction['format']}:{unit['number']}",
                       quote=text, startLine=1, endLine=end,
                       source=dict(kind=extraction['format'], number=unit['number'], start=1, end=end))
    else:
        lines = policy['content'].replace('\r\n', '\n').replace('\r', '\n').split('\n')
        start, current = None, []
        for index, line in enumerate(lines + ['']):
            if line.strip():
                if start is None:
                    start = index + 1
                current.append(line)
            elif current:
                yield dict(passageId=f"{policy['id']}:{start}", quote='\n'.join(current), startLine=start, endLine=index)
                start, current = None, []


def index_cases(data):
    if data.get('schemaVersion') != 1 or not isinstance(data.get('cases'), list):
        raise ValueError('Expected schemaVersion 1 and cases list')
    result = {}
    for row in data['cases']:
        if not isinstance(row.get('id'), str) or row['id'] in result:
            raise ValueError('Missing or duplicate case ID')
        result[row['id']] = row
    return result


def evaluate(inputs, labels, predictions):
    cases, golds, preds = map(index_cases, (inputs, labels, predictions))
    if not cases or cases.keys() != golds.keys() or cases.keys() != preds.keys():
        raise ValueError('Inputs/labels/predictions must have identical nonempty ID sets')
    rows = []
    quotes_total = quotes_valid = support_total = support_valid = wrong_filter = 0
    for case_id, case in cases.items():
        gold, pred = golds[case_id], preds[case_id]
        if not isinstance(gold.get('answerable'), bool):
            raise ValueError('Gold answerable must be boolean')
        if pred.get('decision') not in ('answered', 'refused', 'unavailable'):
            raise ValueError('Invalid prediction decision')
        refs = {}
        for policy in case['policies']:
            for p in passages(policy):
                refs[p['passageId']] = dict(p, rowId=policy['id'], documentId=policy['documentId'],
                                            version=policy['version'], title=policy['title'], policy=policy)
        if any(s not in refs for s in gold['supportIds'] + gold['requiredIds']):
            raise ValueError('Gold references nonexistent source')
        if gold['answerable'] and not gold['supportIds']:
            raise ValueError('Answerable gold requires supporting evidence')
        citations = pred.get('citations', [])
        if not isinstance(citations, list):
            raise ValueError('Citations must be a list')
        valid, cited_ids, selected_support = [], [], []
        for citation in citations:
            quotes_total += 1
            ref = refs.get(citation.get('passageId'))
            options = case['options']
            eligible = bool(ref and ref['policy']['status'] == 'approved'
                            and ref['policy']['effectiveFrom'] <= options['date']
                            and (not ref['policy'].get('effectiveUntil') or options['date'] < ref['policy']['effectiveUntil'])
                            and options['status'] == 'approved'
                            and options.get('department', 'all') in ('all', ref['policy']['department'])
                            and pred.get('options') == options)
            version_okay = bool(ref and all(citation.get(key) == ref[key] for key in ('rowId', 'documentId', 'version')))
            if not eligible or not version_okay:
                wrong_filter += 1
            expected = {k: v for k, v in (ref or {}).items() if k != 'policy'}
            actual = {k: v for k, v in citation.items() if k != 'role'}
            okay = bool(eligible and expected == actual and citation.get('role') in ('support', 'context'))
            valid.append(okay)
            quotes_valid += int(okay)
            cited_ids.append(citation.get('passageId'))
            if citation.get('role') == 'support':
                support_total += 1
                selected_support.append(citation.get('passageId'))
                support_valid += int(okay and citation.get('passageId') in gold['supportIds'])
        answered = pred['decision'] == 'answered'
        support_okay = bool(selected_support) and set(selected_support) <= set(gold['supportIds'])
        complete = set(gold['requiredIds']) <= set(cited_ids)
        integral = bool(citations) and all(valid) and len(cited_ids) == len(set(cited_ids))
        correct_answer = bool(gold['answerable'] and answered and integral and support_okay and complete
                              and pred.get('kind') == 'extractive' and pred.get('question') == case['question'])
        correct_refusal = bool(not gold['answerable'] and pred['decision'] == 'refused'
                               and pred.get('reason') in gold.get('allowedReasons', []) and not citations)
        ranking = pred.get('rankedIds', [])
        ranks = [ranking.index(s) + 1 if s in ranking else 0 for s in gold['supportIds']]
        failures = []
        if gold['answerable'] and not correct_answer:
            if pred.get('kind') != 'extractive' or pred.get('question') != case['question']:
                failures.append('invalid-answer-envelope')
            if not answered:
                failures.append('missed-answer:' + pred.get('reason', 'unknown'))
            else:
                if not integral:
                    failures.append('citation-integrity')
                if not support_okay:
                    failures.append('unsupported-evidence-selection')
                if not complete:
                    failures.append('missing-qualification')
        if not gold['answerable'] and not correct_refusal:
            failures.append('unsupported-answer' if answered else 'incorrect-refusal-or-system-error')
        rows.append(dict(id=case_id, category=case.get('category'), question=case['question'],
                         answerable=gold['answerable'], decision=pred['decision'], reason=pred.get('reason'),
                         correctAnswer=correct_answer, correctRefusal=correct_refusal,
                         unsupportedAnswer=bool(not gold['answerable'] and answered),
                         citationIntegrity=integral if answered else None,
                         supportCorrect=support_okay if answered else None,
                         qualificationComplete=complete if answered else None,
                         ranks=ranks, failures=failures))
    answerable = [r for r in rows if r['answerable']]
    insufficient = [r for r in rows if not r['answerable']]
    answered = [r for r in rows if r['decision'] == 'answered']
    correct = sum(r['correctAnswer'] for r in answerable)
    unsupported = sum(r['unsupportedAnswer'] for r in insufficient)
    ratio = lambda n, d: n / d if d else None
    recall = lambda k: ratio(sum(sum(0 < rank <= k for rank in r['ranks']) / len(r['ranks']) for r in answerable), len(answerable))
    result = dict(schemaVersion=1, cases=len(rows), answerable=len(answerable), insufficient=len(insufficient),
                  correctAnswerable=correct, unsupportedAnswers=unsupported,
                  correctRefusals=sum(r['correctRefusal'] for r in insufficient),
                  unavailable=sum(r['decision'] == 'unavailable' for r in rows),
                  answered=len(answered), coverage=ratio(len(answered), len(rows)),
                  accuracyAmongAnswered=ratio(correct, len(answered)),
                  answerableAccuracy=ratio(correct, len(answerable)),
                  unsupportedRate=ratio(unsupported, len(insufficient)),
                  answerableAccuracyWilson95=wilson(correct, len(answerable)),
                  unsupportedRateWilson95=wilson(unsupported, len(insufficient)),
                  citations=dict(total=quotes_total, valid=quotes_valid, integrity=ratio(quotes_valid, quotes_total),
                                 supportTotal=support_total, supportValid=support_valid,
                                 supportPrecision=ratio(support_valid, support_total), wrongVersionOrFilter=wrong_filter,
                                 completeAnswered=sum(r['answerable'] and bool(r['qualificationComplete']) for r in answered),
                                 answeredAnswerable=sum(r['answerable'] for r in answered),
                                 qualificationCompleteness=ratio(sum(r['answerable'] and bool(r['qualificationComplete']) for r in answered), sum(r['answerable'] for r in answered))),
                  retrieval=dict(recall1=recall(1), recall3=recall(3), recall5=recall(5),
                                 mrr=ratio(sum(1 / min([x for x in r['ranks'] if x] or [math.inf]) for r in answerable), len(answerable))),
                  targets=dict(correctAnswerableAtLeast16=correct >= 16,
                               unsupportedAnswersZero=unsupported == 0,
                               citationsAllValid=quotes_total > 0 and quotes_valid == quotes_total,
                               wrongVersionOrFilterZero=wrong_filter == 0),
                  note='Gold section annotations proxy semantic support. Synthetic internal reservation is not independently authored evaluation. Inspect raw cases and failures; no automated factual entailment guarantee.',
                  rows=rows)
    result['targets']['allMet'] = all(result['targets'].values())
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('inputs', 'labels', 'predictions', 'output'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    load = lambda path: json.loads(path.read_text(encoding='utf-8-sig'))
    report = evaluate(load(args.inputs), load(args.labels), load(args.predictions))
    with args.output.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(report, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write('\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'rows'}, indent=2))


if __name__ == '__main__':
    main()
