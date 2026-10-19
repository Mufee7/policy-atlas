# Policy Atlas roadmap

The goal is an AI/ML engineering internship portfolio that demonstrates reproducible reasoning, learning and honest limitations. [PROJECT_STATUS.md](PROJECT_STATUS.md) is the authoritative current inventory. This roadmap orders remaining **original requirements**, not convenience additions. Keep the existing app working and all additional services free. No feature implementation or deployment is authorized by this document alone.

<a id="next-milestone"></a>

## 1. Grounded extractive answering ? bounded baseline implemented

The user authorized this milestone after reconciliation. Local Git baseline c2cfe5e, pre-implementation protocol/reservation 51fa082 and frozen implementation 5b6c60f are recorded. The working answerer, refusal view, verified quotations/context and offline Python evaluator are implemented. [Original protocol and targets](docs/ANSWERING_PROTOCOL.md), [all results/failures](docs/ANSWERING_RESULTS.md), [learning guide/exercise](docs/ANSWERING_LEARNING.md).

One-shot internal final result: **16/20 correct answerable, 0/20 unsupported, 20/20 correct refusals, 96/96 valid citations**. Four answerable paraphrases were refused. Initial sample gates passed. Development contained 40 cases; final contained 40 separate cases, frozen before tuning with labels outside the application/development feedback loop. The final set is now **consumed**; implementation/evaluator were not tuned after feedback.

The stronger original criterion of independently authored evaluation is **not met**: the same coding agent authored fixtures and code, and different source families share sentence templates. Do not call this an external independent benchmark or general reliability proof. Generated answering, broad semantic support and semantic-mode answer accuracy are still unverified/missing as described in [PROJECT_STATUS.md](PROJECT_STATUS.md).

### Recommended next milestone: independent evaluation and broader question coverage

Keep grounded answering/evaluation ahead of generated answers and convenience features. No implementation of this follow-up is started here.

1. Arrange annotation by a reviewer who does not tune the system, using less repetitive fictional or permission-cleared policies. Keep versions/near-duplicates in one split. Record authorship, access history, disagreements and licensing.
2. Expand question-language handling using **new development cases**, including paraphrases, hard negatives, negation, exceptions, unrelated quantities and ambiguous authority. The consumed failures may inform development, but cannot remain final-test evidence for a new version. Preserve exact quotations, complete qualifications and distinct unavailable/refused states.
3. Reserve a **fresh** 40-case final set (20 answerable/20 insufficient), with labels withheld from implementers. Fix rubric/thresholds before tuning, freeze code/configuration, then infer once. If independence cannot be demonstrated, label results internal/development and leave the criterion open.
4. Retain initial sample gates: at least 16/20 correct answerable, 0/20 unsupported, 100% citation integrity and zero wrong-version/filter citations. Report all failures, coverage, support/completeness, Recall@k/MRR and uncertainty. Do not change targets after feedback. Human semantic review stays distinct from quote-existence checks.
5. Preserve 100 software tests, seven Python evaluator tests, typecheck/build and existing browser flows. Follow [AGENTS.md](AGENTS.md) for browser runs. Publish raw predictions/error analysis and a learning note on precision/coverage and leakage. Keep services free and current UI/storage intact.

Exit: separately authored, honestly bounded evaluation plus improved development coverage. If gates fail, retain failure and use another new reserved set for the next final claim. Software tests alone never establish answer accuracy.

## 2. Evidence-grounded generated answering, if needed to finish the original answer requirement

The original grounded-answer requirement can first be satisfied extractively. If authored natural-language synthesis remains part of the intended portfolio, implement it as a separate, explicitly generated mode only after the independent-evaluation follow-up in milestone 1. Assess free local inference feasibility on the available Windows hardware; record a no-generation outcome if infeasible rather than introducing a paid dependency.

Gate generated outputs through evidence eligibility, claim-level citations and refusal. Evaluate unsupported claims, citation support/completeness, qualifiers, contradictory evidence, prompt injection in documents and missing evidence using a new reserved evaluation set. Compare against the extractive baseline, including failure cases and latency. Do not describe a deterministic quotation formatter as a generative model. No provider/model choice or download is made in this roadmap.

## 3. Complete and evaluate the API boundary; add focused FastAPI learning

Existing [document](app/api/documents/route.ts) and [review](app/api/conflict-reviews/route.ts) routes stay in place. Define typed search/answer API contracts, errors, filters, evidence IDs and refusal responses from the now-evaluated answer slice. Add request validation, authorization tests and reproducible examples.

For the Python/FastAPI goal, implement a small FastAPI adapter/service for that concrete contract, with Pydantic models, OpenAPI and integration/parity tests against exported fixtures. First document how authenticated corpus data reaches it; never accept caller-supplied owner headers as proof of identity, duplicate live persistence without a migration plan, or rewrite the UI merely to claim another framework. Benchmark and document differences between Python and browser inference if both are used. Keep execution local/free.

Exit: usable documented API, deterministic error/refusal semantics, filter/citation parity, two-user access tests at the chosen boundary, and a learning note on validation, async HTTP and storage ownership. This milestone is missing today; an existing TypeScript API is not FastAPI experience.

## 4. Close original ingestion, comparison and conflict-quality gaps

Use [the status matrix](PROJECT_STATUS.md#original-requirements-reconciled) and [verification history](docs/VERIFICATION_HISTORY.md) as the baseline instead of rebuilding these features.

- Independently label additional PDF/DOCX layouts and check extraction fidelity, ordering and provenance against originals. Record unsupported layouts explicitly. OCR remains an optional scoped extension, not a silently assumed capability.
- Verify the dedicated version-comparison browser view: selection/direction, draft/history notices, both-source navigation, coarse fallback and export. Distinguish textual change from semantic/legal change.
- Evaluate the four supported conflict pattern families on new, independently labelled pairs, including hard negatives, exceptions, scope, currency and deadline anchors. Report precision/recall and abstention/unsupported-topic coverage by family. Keep the method labelled rule-based; no need to introduce ML solely for branding.
- Add immutable review history or expand pattern coverage only when the original traceability requirement and observed errors justify it. Keep both-source evidence and human authority review.

Exit: documented fidelity/quality results with error categories, the missing comparison UI evidence, and explicit supported-topic limits. Passing the existing pattern tests alone is insufficient.

## 5. Storage, security and free deployment readiness

Before any shared deployment, document a threat model covering identity-header trust, owner isolation, uploads/extraction trust, cross-origin writes, request/resource limits, document prompt injection if generation exists, logs and private data. Verify two separate accounts across list/download/upload/delete/review/search/answer flows. Resolve or explicitly handle D1/R2 partial failures, deletion races and recovery; decide whether server-side extraction validation is needed for the intended trust level.

Build on [local setup](docs/LOCAL_SETUP.md), [local backup verification](docs/LOCAL_TOOLS_VERIFICATION.md) and [portability audit](docs/PORTABILITY_AUDIT.md). Test fresh-machine installation and restoration using synthetic data. Select a free deployment option only after verifying its current limits and authentication/storage suitability; use no paid keys or billable upgrade. If no suitable free host is available, deliver a reproducible local demo and record remote deployment as incomplete. Maintain local Git history and its [checkpoint provenance](docs/GIT_CHECKPOINT.md); no remote is required for local portfolio work.

Exit: documented trusted identity boundary, passed account-isolation tests, deploy/recovery instructions, validated free-service constraints, and a verified deployed smoke test if deployment occurs. A local successful build is not deployment evidence. Do not expose the raw identity-trusting Worker publicly.

## 6. Portfolio handoff

Prepare an architecture walkthrough, short demo, reproduction commands and an honest results/error-analysis page backed by the completed milestones. Explain pretrained ML inference, rule-based logic, extractive/generated modes and independent-evaluation protocol separately. Record dataset/model licenses and the author's project-license decision before public redistribution. Resume claims must match measured results; retain failed experiments and limitations.

Convenience features and visual polish remain lower priority than grounded answers, refusal and independent evaluation. The bounded answering milestone is implemented; the **independent-evaluation follow-up in milestone 1 is the single recommended next action**, not work started now.
