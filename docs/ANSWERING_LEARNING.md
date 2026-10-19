# Extractive answering: learning and reproduction

Read [the pre-implementation protocol](ANSWERING_PROTOCOL.md) for supported questions, refusal rules, annotation rubric and data separation. This is a deterministic extractive selector over existing retrieval, not generated answers or a trained answerability model.

## Try the working flow

Follow [LOCAL_SETUP.md](LOCAL_SETUP.md), sign in locally and keep Approved only with date `2026-10-19`. Search:

- `What is the remote work allowance?` — inspect the allowance, eligibility/exclusions, written approval and exception quotations. Each citation opens the selected stored version and source location.
- `What is the remote work insurance allowance?` — the policy does not establish that entitlement; expect insufficient evidence.
- `Can I work from home tomorrow?` — outside the supported grammar/personalized decision scope. The app refuses to infer an answer; evidence search remains usable.

Use **Export answer decision and citations** for JSON with question, filters, decision/reason, retrieval method and exact quotations. Whole-source context is intentional: quoting a numeric allowance without its approval/eligibility conditions can give the wrong impression.

## The concepts

**Retrieval vs support.** BM25 measures word matching; MiniLM uses pretrained embeddings to retrieve similar text. Neither score means a proposition is true or that an exception applies. The answer layer separately checks a supported question form, topic and explicit predicate, eligibility, ambiguity and source identity. These rules are conservative and can still confuse relationships; they do not provide a general semantic guarantee.

**Extractive vs generated.** An extractive answer copies stored text. A generated answer composes new language. This milestone does the former. Exact text and correct locations make the source verifiable, but a perfectly copied irrelevant quote is still an incorrect answer.

**Precision vs coverage.** Refusing more questions may reduce unsupported answers while missing genuinely answerable questions. Report accuracy on the full answerable denominator and coverage, not just the percentage correct among answered questions. Otherwise an always-refuse system could look safe without being useful.

**Development vs final evaluation.** Development labels are feedback for debugging. The reserved queries/labels are not imported by the app, ordinary tests or prediction code. A one-shot final evaluation measures the frozen implementation. Once its results are seen, those cases are consumed; do not tune on them and retain an independent claim. Our internally authored template fixtures are not independently authored external data, even though final labels were withheld from development feedback.

**A scorer is a program, not an oracle.** [evaluate_answers.py](../scripts/evaluate_answers.py) joins three datasets by case ID: inputs, expected labels, and predictions. It independently reconstructs source sections, validates quotation/version/location/filter integrity, compares selected evidence with annotations and checks required qualification coverage. It then aggregates counts and ratios. An annotation-based score is a reproducible proxy for human semantic judgment; label errors and narrow templates can bias it.

**Uncertainty.** Wilson intervals express sampling uncertainty for a binomial proportion. Zero unsupported answers out of 20 has a 95% upper bound of about 16.1%, even before dataset bias is considered. It is not evidence of a zero real-world failure rate.

## Offline Python evaluator

The evaluator targets Python 3.13 and uses only `argparse`, `json`, `math` and `pathlib` from the standard library. There are **no pip dependencies or API calls**. This workspace uses the official Python 3.13.13 Windows embeddable runtime under ignored `.tools/python-3.13.13`, verified against its published archive SHA-256. [Official package/checksum source](https://www.python.org/downloads/release/python-31313/). A normal Python 3.13 installation can run the same file.

First run the JavaScript tests to compile the prediction code, then create development predictions at a new output path:

```powershell
pnpm.cmd test
node scripts/predict-answers.mjs evaluation/answering/development.inputs.json outputs/dev-predictions.json
```

One evaluator command (after predictions exist):

```powershell
.\.tools\python-3.13.13\python.exe scripts/evaluate_answers.py --inputs evaluation/answering/development.inputs.json --labels evaluation/answering/development.labels.json --predictions outputs/dev-predictions.json --output outputs/dev-report.json
```

Use a new output filename for each run; outputs are created exclusively to avoid silently overwriting evidence. For regular Python use `python` in place of the portable executable. Run evaluator tests with `.\.tools\python-3.13.13\python.exe tests/test_answer_evaluator.py`.

After final evaluation, the committed `evaluation/answering/final/` directory contains inputs, labels, predictions, per-case report and attempt record. The same Python command with those three files and a new output path **re-scores saved predictions only**. Do not run final inference again. The final runner enforces reservation/freeze hashes and an exclusive attempt marker; it is an accidental-rerun guard, not a security boundary against deliberate tampering.

## Small exercise — after reviewing the working milestone

Copy the **development** predictions to a new ignored file under `outputs/`. For one answered case, remove a context citation containing an exclusion or approval condition. Re-score that copy with the Python evaluator.

Before running it, predict which metrics should change. Check that answer correctness/qualification completeness falls while the remaining quotations can still have 100% citation integrity. Explain in two sentences why those are different properties. Do not modify final labels or final predictions for this exercise.
