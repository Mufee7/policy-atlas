# Grounded extractive answering — results and failures

Date: 2026-10-19. Baseline `c2cfe5e`; protocol/reservation `51fa082`; implementation frozen at `5b6c60fe04101f3a1cc403c0b8b221f158abccbb`. No application/evaluator changes followed final scoring. [Protocol](ANSWERING_PROTOCOL.md), [freeze](../evaluation/answering/implementation-freeze.json), [attempt](../evaluation/answering/final/attempt.json).

## Final one-shot results

Exactly 40 cases: 20 answerable, 20 insufficient. Keyword retrieval plus deterministic extractive selection, no generative model/paid service. All cases remain in the denominators, including unsupported question forms.

| Measure | Result | Initial target |
|---|---:|---:|
| Correct answerable | **16/20 (80%)** | At least 16/20 |
| Unsupported answers on insufficient cases | **0/20** | Zero |
| Correct insufficient-evidence refusals | 20/20 | Report all |
| Exact quote/document/version/location integrity | 96/96 quotations | 100% |
| Wrong-version/filter citations | 0 | Zero |
| Gold-supported direct evidence | 16/16 | Report separately |
| Required qualification completeness among emitted answerable responses | 16/16 | Complete |
| Overall answer coverage | 16/40 (40%) | Report separately |
| Correct among emitted answers, by annotation rubric | 16/16 | Not a substitute for full answerable accuracy |
| System unavailable | 0 | Report separately |
| Retrieval Recall@1 / @3 / @5 | 75% / 75% / 100% | Diagnostic |
| Retrieval MRR | .8025 | Diagnostic |

Initial sample gates passed; general reliability is not established. Wilson 95% intervals: approximately 58.4–91.9% answerable accuracy and 0–16.1% unsupported-answer rate. These are descriptive binomial summaries; templated/clustered synthetic cases are not a representative population sample.

## Every final failure

All four are false refusals (`unsupported-question`). The gold passage was retrieved, but the fixed grammar rejected the paraphrase. None was dropped or relabelled.

| Case | Question | Gold relation | Passage rank | Outcome |
|---|---|---|---:|---|
| final-02 | Whose permission is needed for field visits? | Approval | 4 | Missed answer |
| final-14 | How much uniform collection is permitted each week? | Limit | 1 | Missed answer |
| final-22 | Whose permission is needed for journal purchases? | Approval | 5 | Missed answer |
| final-38 | How long do we have to complete resource transfers? | Deadline | 5 | Missed answer |

The bottleneck is grammar coverage, not absence of the gold passage in the top five. These cases are now consumed knowledge. Extending the grammar requires new development work and a fresh final set. The frozen implementation remains unchanged.

## Development and software verification

The first development result was 14/20 correct answerable, 0/20 unsupported. A PDF/DOCX heading mismatch labelled nearby conditional sections as direct evidence; the [initial report](../evaluation/answering/development/initial-report.json) is retained. Development-only fixes led to [20/20 and 0/20](../evaluation/answering/development/report.json).

Two additional pre-freeze tests exposed ambiguity outside supplied retrieval hits and unrelated nearby numbers being mistaken for a requested fact. Both failed before correction. The final code checks all eligible sections for ambiguity and uses explicit relevant statements/numeric predicates. These heuristics are not universal entailment. Pre-fix log: `outputs/answering-development/guard-before-fix.log`.

Final checks: 100 Node/TypeScript tests, seven Python evaluator tests, typecheck/build passed. The full 22-test visible browser regression passed before the last two refusal guards; afterward the targeted answer/source/export/refusal flow passed again, plus all software/build checks. Headed Chromium, `slowMo: 800`, videos and ten-second inspection pauses. Software verification is separate from answer accuracy.

## Provenance, independence and audit

- [Reservation](../evaluation/answering/reservation.json) fixed input/label hashes before implementation. The final runner checked frozen source/compiled hashes, created an exclusive marker and inferred once. A subsequent guard probe returned `EEXIST` before inference; predictions/report were preserved.
- Published after consumption: [inputs](../evaluation/answering/final/inputs.json), [labels](../evaluation/answering/final/labels.json), [predictions](../evaluation/answering/final/predictions.json), [all per-case scores](../evaluation/answering/final/report.json). All fixtures are fictional; no private uploads/notes. Labels were never imported into the app or ordinary tests.
- Logical document families are disjoint across splits, but share substantial sentence templates. The same coding agent authored fixtures and implementation. This is **internally reserved synthetic evaluation**, not independently authored external evaluation or strong semantic generalization evidence. The construction recipe is retained for audit.
- PDF/DOCX fixtures represent extracted text/page/paragraph locations; they do not re-evaluate physical parsing. Existing parser/browser checks address that separately.
- Labels annotate direct supporting sections and required full-policy context. Python independently resolves quotations/references/filters and uses annotations as a support proxy. The coding agent inspected selected supporting text after the run; no independent adjudicator or LLM judge established semantic ground truth.
- Semantic-mode answer accuracy, broad paraphrases, unseen relationships/negation, complex original layouts, real policies, calibrated refusal and production deployment remain unverified. Similarity is not support.

See [offline reproduction and the learning exercise](ANSWERING_LEARNING.md#offline-python-evaluator). Re-score saved predictions only; do not rerun final inference or tune against this consumed set while claiming a fresh evaluation.
