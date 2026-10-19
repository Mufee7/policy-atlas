# Policy Atlas roadmap

The goal is an AI/ML engineering internship portfolio that demonstrates reproducible reasoning, learning and honest limitations. [PROJECT_STATUS.md](PROJECT_STATUS.md) is the authoritative current inventory. This roadmap orders remaining **original requirements**, not convenience additions. Keep the existing app working and all additional services free. No feature implementation or deployment is authorized by this document alone.

<a id="next-milestone"></a>

## 1. Grounded extractive answering and independent evaluation — recommended next milestone

Deliver a small question-answering slice over the existing retrievers and source inspector. Select exact supporting quotations with relevant qualifiers and explicit source/version references. Label it **extractive**; do not call it generated answers. If the retrieved material cannot directly support an answer, return an explicit insufficient-evidence decision. Ranking scores alone must not establish support.

Sequence the work so evaluation is defined before answer selection or refusal tuning:

1. Define the task, answer/refusal response schema, annotation rubric and evaluation protocol. Audit existing data using [the independence findings](PROJECT_STATUS.md#evaluation-independence-audit); retain all current questions as development data.
2. Assemble at least 80 newly labelled cases: 40 development and 40 reserved evaluation cases, with 20 answerable and 20 insufficient-evidence cases in the reserved set. Split by policy family so all versions and near-duplicate wording stay within one split. Include TXT/PDF/DOCX, paraphrases, historical/draft filters, scope/exception questions, misleading lexical matches, irrelevant nearest neighbors and overlapping/ambiguous evidence. Label acceptable evidence spans, required qualifications, version/date/filter conditions and refusal reasons. Use fictional or permission-cleared documents only.
3. Reserve test queries/labels through a reviewer who does not tune the implementation. Record authorship, access/use history, split membership and hashes. The indexed evaluation documents may be available at inference time; queries/labels must not guide implementation, threshold selection or model selection. If separation cannot be demonstrated, call it a development evaluation and leave the independent-evaluation criterion unmet.
4. Implement the minimal extractive answer/refusal layer using the existing retrieval and provenance code. Keep evidence search available; preserve ingestion, comparison, review and saved notes. Export structured predictions with selected evidence, source IDs/locations, filters, method/configuration and decision reason.
5. Add a small **offline Python evaluator** that consumes exported predictions plus labels. Pin its dependencies, validate inputs and document one reproduction command. This closes a useful Python learning gap without rewriting the app. Implement/tune only on development data.
6. Freeze code/configuration, then have the reviewer run the reserved evaluation once. Publish raw per-case outputs, denominators, failures and an error analysis. Subsequent tuning against those cases makes them development data; reserve fresh data for the next independent claim.

Acceptance criteria (proposed release gates, **not current results**):

- Every emitted answer is explicitly marked extractive and consists of exact source quotations; every quotation resolves to the correct stored version and TXT lines, PDF page/extracted lines or DOCX paragraph. Automated citation/quote integrity: **100%** on the evaluation cases; human review must also assess whether the quotation supports the answer and retains exceptions.
- Explicit refusal for insufficient/ambiguous evidence, empty or ineligible corpora, and retrieval failure; distinguish system failure from “policy does not exist.” Do not answer from an excluded draft/version or silently choose authority between overlapping rules. Test each of these behaviors on development data before freezing.
- On the 40 reserved cases: **zero unsupported answers among the 20 insufficient-evidence cases**, at least **16/20 answerable cases answered correctly**, and **zero wrong-version/filter citations**. Unsupported or missing qualifiers count as incorrect. Report answer coverage, accuracy among answered cases, false-answer rate on insufficient cases, citation support/completeness, Recall@k/MRR and per-category errors separately; include counts/uncertainty and acknowledge the small sample.
- The Python evaluator reproduces the report from saved inputs and covers both answering and abstention. Quote existence is evaluated separately from semantic support; no LLM judge is treated as independent ground truth.
- Preserve all existing 89 software tests/typecheck/build. Add focused answer/refusal tests and one visible browser flow proving a supported answer, source verification and an insufficient-evidence refusal. Follow [AGENTS.md](AGENTS.md): headed Playwright, `slowMo: 800`, advance notice and inspection pause.
- Produce a short learning note explaining embeddings vs BM25, support vs similarity, abstention/coverage trade-offs, label leakage, confidence limits and the Python evaluator's design. No paid endpoint or public deployment required.

**Exit decision:** if the independent gates fail, report failure and preserve the baseline. Improve against development data and use a new reserved set for a new independent claim. Do not weaken thresholds after seeing reserved results or relabel a reused set as held-out.

## 2. Evidence-grounded generated answering, if needed to finish the original answer requirement

The original grounded-answer requirement can first be satisfied extractively. If authored natural-language synthesis remains part of the intended portfolio, implement it as a separate, explicitly generated mode only after milestone 1. Assess free local inference feasibility on the available Windows hardware; record a no-generation outcome if infeasible rather than introducing a paid dependency.

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

Build on [local setup](docs/LOCAL_SETUP.md), [local backup verification](docs/LOCAL_TOOLS_VERIFICATION.md) and [portability audit](docs/PORTABILITY_AUDIT.md). Test fresh-machine installation and restoration using synthetic data. Select a free deployment option only after verifying its current limits and authentication/storage suitability; use no paid keys or billable upgrade. If no suitable free host is available, deliver a reproducible local demo and record remote deployment as incomplete. Establish actual Git history in a deliberate later step; [current Git limitations](docs/GIT_CHECKPOINT.md) must remain visible until resolved.

Exit: documented trusted identity boundary, passed account-isolation tests, deploy/recovery instructions, validated free-service constraints, and a verified deployed smoke test if deployment occurs. A local successful build is not deployment evidence. Do not expose the raw identity-trusting Worker publicly.

## 6. Portfolio handoff

Prepare an architecture walkthrough, short demo, reproduction commands and an honest results/error-analysis page backed by the completed milestones. Explain pretrained ML inference, rule-based logic, extractive/generated modes and independent-evaluation protocol separately. Record dataset/model licenses and the author's project-license decision before public redistribution. Resume claims must match measured results; retain failed experiments and limitations.

Convenience features and visual polish remain lower priority than grounded answers, refusal and independent evaluation. The current reconciliation ends at documentation and checkpoint recording; **milestone 1 is the single recommended next action, not work started now**.
