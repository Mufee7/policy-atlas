"""Run directly with Python; imports evaluator without third-party packages."""
import importlib.util
from pathlib import Path
import unittest
import copy

spec = importlib.util.spec_from_file_location('evaluator', Path(__file__).resolve().parents[1] / 'scripts/evaluate_answers.py')
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


class EvaluationTests(unittest.TestCase):
    def setUp(self):
        policy = dict(id='a', documentId='A', version='1', title='Demo', status='approved',
                      effectiveFrom='2026-01-01', effectiveUntil=None, department='Ops',
                      content='Limit\nThe demo limit is three units.\n\nScope\nInterns are excluded.')
        self.options = dict(date='2026-10-19', status='approved', department='all')
        self.inputs = dict(schemaVersion=1, cases=[dict(id='1', policies=[policy], options=self.options, question='What is the demo limit?')])
        self.labels = dict(schemaVersion=1, cases=[dict(id='1', answerable=True, supportIds=['a:1'], requiredIds=['a:1', 'a:4'])])
        citations = [dict(p, rowId='a', documentId='A', version='1', title='Demo', role='support' if p['passageId'] == 'a:1' else 'context') for p in evaluator.passages(policy)]
        self.preds = dict(schemaVersion=1, cases=[dict(id='1', kind='extractive', decision='answered', question='What is the demo limit?', options=self.options, citations=citations, rankedIds=['a:1'])])

    def test_complete_answer_and_retrieval(self):
        report = evaluator.evaluate(self.inputs, self.labels, self.preds)
        self.assertEqual(report['correctAnswerable'], 1)
        self.assertEqual(report['citations']['integrity'], 1)
        self.assertEqual(report['retrieval']['mrr'], 1)

    def test_missing_qualification_is_incorrect_even_with_real_quote(self):
        self.preds['cases'][0]['citations'].pop()
        report = evaluator.evaluate(self.inputs, self.labels, self.preds)
        self.assertEqual(report['correctAnswerable'], 0)
        self.assertIn('missing-qualification', report['rows'][0]['failures'])

    def test_fabricated_quote_and_wrong_version_fail(self):
        for field, value in [('quote', 'fabricated'), ('version', '9')]:
            preds = copy.deepcopy(self.preds)
            preds['cases'][0]['citations'][0][field] = value
            report = evaluator.evaluate(self.inputs, self.labels, preds)
            self.assertEqual(report['correctAnswerable'], 0)
            if field == 'version':
                self.assertEqual(report['citations']['wrongVersionOrFilter'], 1)

    def test_unsupported_answer_and_unavailable_are_not_correct_refusals(self):
        self.labels['cases'][0].update(answerable=False, supportIds=[], requiredIds=[], allowedReasons=['no-support'])
        self.assertEqual(evaluator.evaluate(self.inputs, self.labels, self.preds)['unsupportedAnswers'], 1)
        pred = self.preds['cases'][0]
        pred.update(decision='unavailable', reason='retrieval-failed', citations=[])
        self.assertEqual(evaluator.evaluate(self.inputs, self.labels, self.preds)['correctRefusals'], 0)
        pred.update(decision='refused', reason='no-support')
        self.assertEqual(evaluator.evaluate(self.inputs, self.labels, self.preds)['correctRefusals'], 1)

    def test_duplicate_prediction_ids_are_rejected(self):
        self.preds['cases'].append(self.preds['cases'][0])
        with self.assertRaises(ValueError):
            evaluator.evaluate(self.inputs, self.labels, self.preds)

    def test_real_but_irrelevant_quote_is_not_a_correct_answer(self):
        self.preds['cases'][0]['citations'][0]['role'] = 'context'
        self.preds['cases'][0]['citations'][1]['role'] = 'support'
        report = evaluator.evaluate(self.inputs, self.labels, self.preds)
        self.assertEqual(report['citations']['integrity'], 1)
        self.assertEqual(report['correctAnswerable'], 0)
        self.assertEqual(report['citations']['supportPrecision'], 0)

    def test_zero_failures_interval_still_has_nonzero_upper_bound(self):
        self.assertGreater(evaluator.wilson(0, 20)[1], .15)


if __name__ == '__main__':
    unittest.main()
