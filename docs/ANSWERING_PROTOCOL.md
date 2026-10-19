# Extractive answering protocol v1 — fixed before implementation

Date: 2026-10-19. Baseline: `c2cfe5ef6757bbfc793dff953f68534c5ac923c4`. No generated answers, paid service, model training or deployment.

## Supported questions

English, direct, single-topic requests in these explicitly bounded forms (case-insensitive):

- `What is the <topic> limit?` or `What is the <topic> allowance?`
- `What is the <topic> deadline?`
- `Who approves <topic>?` or `What is the <topic> approval rule?`
- `Who is eligible for <topic>?`
- `What are the <topic> requirements?` or `What is the <topic> requirement?`

Examples: `What is the remote work allowance?`, `Who approves international travel?`, `What is the incident reporting deadline?`. A question can be answerable in principle yet outside these supported forms. Such a refusal counts as a missed answer on an answerable evaluation case; it is not silently removed from the denominator.

Unsupported: personalized decisions, yes/no permission, arithmetic/unit conversion, inferred exceptions, multiple independent questions, cross-document synthesis, legal interpretation, requested authority resolution, and free-form paraphrases outside the grammar. Retrieval remains available for these requests.

## Sufficiency and refusal policy

1. Only approved documents within the requested date and department are eligible for answering. Draft/all-status search remains usable, but must not become authoritative answering. Invalid filters, library/retrieval errors and empty corpora produce explicit non-answer states.
2. Parse a supported question and require explicit topic words in a retrieved source section, plus explicit predicate evidence for that question type: numeric allowance/limit, a deadline anchor, named approval language, eligibility language, or an obligation for requirements. BM25/cosine scores are never evidence of support. Conservative lexical rules are a bounded baseline, not a trained entailment model.
3. Require one unambiguous matching document. Never select authority among matching policies or overlapping approved versions. Refuse if there is no explicit predicate or evidence says the requested rule is undefined/undecided. No-result means insufficient evidence under these filters, not proof that no rule exists.
4. Retain complete sections from the selected policy, including eligibility, exclusions, conditions, approval and exception sections, rather than truncating the top match into an unconditional claim. Label the section that directly supports the request; label other sections as context. Refuse when the bounded full context cannot fit (16 sections/12,000 characters). This intentionally favors context over brevity.
5. Re-resolve each quotation against the current eligible policy and section identity. Validate exact text, document row ID, logical document ID, version and source location. TXT references use line ranges; PDF uses physical page and extracted lines; DOCX uses extracted paragraph ordinal. A structurally valid quote is necessary but does not itself prove semantic support.
6. Return structured `answered`/`refused`/`unavailable` decisions with reason codes, the original question/filters, retrieval method and complete quote/citation records. Display **Extractive answer** and warnings that this is copied evidence, not generated advice or a personalized permission decision. No silent edits/ellipsis to quotations.

Known risk fixed in advance: lexical predicate/topic co-occurrence can still miss negation or relationships. Evaluation must expose those failures; exact quotations cannot eliminate semantic errors. This is a narrow answer selector, not a general entailment guarantee.

## Rubric and metrics

Evaluate every case. Gold labels identify answerability, acceptable supporting policy/section IDs, required qualification section IDs and refusal category. They must be authored from policy evidence, not from predicted outputs.

- **Answer correctness (0/1):** an answered response is correct only if a gold-supported section answers the requested fact, its approved version/filters are correct, and every required qualification is included. A refusal on an answerable case scores 0. Additional misleading support scores 0. Semantic support remains a human-review criterion; the evaluator checks explicit annotated section sets as a reproducible proxy.
- **Citation integrity (0/1 per quote):** exact quote and document/version/location must resolve against the corpus. Count all quotes, including context; fail invented/wrong references and wrong-filter citations.
- **Citation support/completeness:** support sections must belong to gold acceptable evidence, and all required context must be present. Report context separately; a real quote in unrelated text is not supporting evidence.
- **Refusal correctness (0/1):** on insufficient-evidence cases a refusal with a compatible reason is correct; answering is an unsupported answer. A system failure is reported separately, never counted as a correct insufficient-evidence refusal.
- Report correct answerable /20, unsupported answers /20, total answer coverage, accuracy among emitted answers, correct refusals, citation integrity/support/completeness, Recall@1/3/5 and MRR over gold supporting sections, category failures and Wilson 95% intervals. These small-sample intervals are descriptive, not general reliability guarantees.

Targets fixed now: **at least 16/20 correct answerable**, **0/20 unsupported answers**, **100% quote/citation integrity**, **zero wrong-version/filter citations**. Never drop hard cases or revise targets after final results. Semantic/hybrid retrieval ranking results from older development data are not answer-accuracy results.

## Data separation and freeze

- New 40-case development data: `evaluation/answering/development.json`, with labels, used for implementation feedback. Existing retrieval examples remain development-only.
- New reserved set: exactly 40 cases, 20 answerable and 20 insufficient. Separate corpus families/versions from development; include TXT, PDF and DOCX **extracted-text representations**. These answer-layer fixtures do not claim to test physical parsing (existing parser/browser tests cover that separately).
- Reserved inputs/labels stay in ignored `work/answering-reserved/`, outside app imports, public assets, normal tests, builds and exports. Record hashes/counts in `evaluation/answering/reservation.json` before implementation. Do not inspect its case rows or run predictions/scoring during tuning.
- This is **internally reserved synthetic evaluation**, not independently authored external evaluation. The same coding agent authors the fixture construction and implementation; deterministic templates share the declared task grammar. Even with no final-label feedback during tuning, author/template overlap limits independence. No claim of unseen pretrained-model training data.
- Freeze implementation, evaluator, protocol and development data in a Git commit before final inference. A one-shot runner checks those hashes, creates an exclusive attempt marker and writes all predictions and scores once. It must refuse a second attempt; crashes are recorded, not silently erased/retried. Re-scoring saved predictions for audit is allowed, but never rerunning final inference after feedback.
- After the one-shot run, publish the final inputs/labels/predictions/report for audit, explicitly marking the set **consumed**. Subsequent work must use a new reserved set for a new final claim. Failures remain visible; do not tune this milestone after opening the final result.
