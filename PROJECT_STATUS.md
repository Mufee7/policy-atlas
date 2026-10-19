# Policy Atlas — authoritative project status

Reconciled on 2026-10-19 for an **AI/ML engineering internship portfolio with learning alongside implementation**. All additional services must remain free. Preserve the working application. This file is the current capability inventory; [ROADMAP.md](ROADMAP.md) orders remaining work. Older increment reports are historical evidence, not competing completion checklists.

## Current conclusion

Policy Atlas is a working local, version-aware evidence retrieval and human review application. It includes pretrained embedding inference, deterministic text comparison and bounded rule-based conflict checks. **It is not yet an evidence-grounded question-answering system.** It has no generated answers, no question-level evidence-sufficiency/refusal mechanism, and no independently evaluated answer accuracy.

89 automated tests and TypeScript checking passed again during this reconciliation. The earlier 21 headed browser tests passed, but were not rerun during this documentation-only reconciliation. Software correctness checks do not establish retrieval relevance, factual answer accuracy, citation support or generalization.

## Terminology and implementation

| Term | Actual project behavior |
|---|---|
| Extractive evidence | Retrieved passages copied from stored text, linked to the source inspector. These are evidence candidates, **not a constructed extractive answer to the question**. |
| Extractive answer | A selected source quotation that directly answers a question, retaining qualifiers and provenance, with a supported/refuse decision. This answer layer is missing. |
| Generated answer | Newly composed language produced by a generative model. No generation model, prompt pipeline or generated-answer validator exists. |
| ML retrieval | Pretrained MiniLM embeddings and cosine ranking in the browser. This is inference with existing weights, not project-specific model training or fine-tuning. |
| Keyword retrieval | BM25 lexical ranking; deterministic information retrieval, not a generative model. |
| Conflict detection | English patterns, number/unit normalization and date/scope conditions. Rule-based candidate detection with human review, **not an ML contradiction classifier**. |

## Original requirements reconciled

“Implemented” means present in code. “Verified” identifies the particular checks performed. Unverified means implemented behavior or a claim still lacks the relevant evidence; missing means no implementation was found.

| Requirement | Implemented and evidence | Verification and remaining gap |
|---|---|---|
| TXT/PDF/DOCX ingestion | [Client extraction](lib/extract-client.ts), [bounds/provenance validation](lib/ingestion.ts), [metadata schema](lib/upload.ts), [document API](app/api/documents/route.ts). Original bytes in R2; extracted text/metadata in D1. | Parser/unit checks and earlier browser uploads, refresh, citations, duplicate rejection and original-download byte checks passed. Complex layouts, every parser limit and encrypted DOCX browser behavior are not established. No OCR. Server validates extraction structure but does not independently re-extract originals. |
| Metadata, versions and provenance | [Policy/passages](lib/core.ts), [storage schema](db/schema.ts). Manual document ID/version/status/department/effective dates; TXT line ranges, PDF physical pages with extracted lines, DOCX extracted paragraph ordinals. | Date boundaries, identities and source references have diagnostic tests. Metadata is user-supplied, not independently verified. References to extracted text do not prove complete or faithful extraction of every original layout. |
| Filtered keyword retrieval | [BM25 and applicability](lib/core.ts): status, department and inclusive-start/exclusive-end date filtering before ranking. | Unit tests and browser flows verify selected behaviors. Small development relevance measurements only; no independent retrieval benchmark. Department metadata is not employee applicability or access authorization. |
| Filtered semantic retrieval | [Candidate/window ranking](lib/retrieval.ts), [client](lib/semantic-client.ts), [WASM worker](public/semantic/worker.mjs), [model provenance](public/models/minilm/provenance.json). Pinned MiniLM q8; mean pooling, normalized embeddings, 180-word windows/32 overlap, max-window score; at most 500 windows, top 10 UI passages. | Earlier browser run exercised real WASM inference, historical cutoff, same-origin assets, cancellation and download failure fallback. No calibrated support threshold, comprehensive latency/scale benchmark or offline-cache guarantee. RRF hybrid is implemented/evaluated in code but not offered in the UI. |
| Evidence-grounded answers and verifiable citations | [Search UI/source inspector](app/page.tsx) presents excerpts, document/version IDs and source locations. Citation infrastructure exists. | Evidence navigation was browser-tested. **Question-conditioned extractive answer construction is missing; generated answers are also missing.** A passage's existence is not proof that it answers the question. No answer-support/citation-completeness evaluation exists. |
| Refusal for insufficient evidence | Keyword zero-hit message and explicit model-failure state in [UI](app/page.tsx); nearest semantic candidates have a disclaimer. | **Answerability/refusal is missing.** A zero lexical match, model error or disclaimer is not a validated refusal policy. Semantic ranking can return irrelevant candidates for unsupported questions. No calibrated selective-answer policy or false-answer-rate result. |
| Version comparison | [Exact-line LCS and bounded fallback](lib/compare.ts), [comparison view](app/version-comparison.tsx). Explicit Before/After choices, source links and JSON export. | 12 diagnostic comparison tests cover input reconstruction, references, direction, boundaries and randomized sequences. Dedicated version-comparison browser workflow remains unverified; selecting two versions during conflict review does not verify this separate view. No semantic/legal change interpretation. |
| Potential-conflict review with both sources | [Four pattern families and classification](lib/conflicts.ts), [examples](lib/conflict-examples.ts), [review UI](app/conflict-review.tsx). Remote-work days, domestic meals, incident deadlines and personal cloud storage; both source passages retained. | Rule/unit diagnostics and earlier browser source inspection/save/refresh/reversed-pair/error/concurrency checks passed. No independent conflict precision/recall, broad natural-language inference or authority resolution. No matches does not mean conflict-free. |
| Persistent review storage | [Review API](app/api/conflict-reviews/route.ts), [pair/signature/revision validation](lib/review-store.ts), [schema](db/schema.ts), [migrations](drizzle/). Owner/pair/date key, stale signatures, atomic revision-conditional saves. | Earlier local refresh/restart persistence and competing-save rejection passed. No immutable review history; true source-deletion/mutation races and hosted account isolation remain unverified. |
| API | Two route modules: [documents GET/POST/DELETE and original download](app/api/documents/route.ts), [reviews GET/POST](app/api/conflict-reviews/route.ts). | Working local application APIs exercised by earlier integration/browser checks. **No search/answer/evaluation service API, FastAPI service or explicit OpenAPI contract.** Retrieval/comparison/conflict analysis run client-side. API behavior is not a hosted security certification. |
| Persistent documents/operations | D1/Drizzle metadata/text, R2 originals; four migrations. [Local setup](docs/LOCAL_SETUP.md), [backup implementation](scripts/local-backup.mjs). | Earlier build and fresh-copy migrations passed. Later backup verification restored a real snapshot to an isolated destination and opened 9 documents/9 reviews; active user state was not replaced. D1/R2 writes/deletes are not a distributed transaction. Power-loss/cross-version/hosted restore is unverified. |
| Evaluation | [12 original queries](lib/samples.ts), [30 development queries + 6 unsupported probes](lib/development.ts), [measurement script](scripts/evaluate-semantic.mjs), [saved report](lib/retrieval-report.json), [tests](tests/retrieval.test.ts). | Development retrieval metrics exist, not independent answering evaluation. No locked independent corpus/query split, answer labels, refusal benchmark, citation-support scoring or conflict benchmark found. See audit below. |
| Deployment | [Vite/Worker configuration](vite.config.ts), [Worker entry](build/sites-worker.ts), portable source exports. | Local Windows build/dev and earlier extracted-copy build verified. README describes the original private Sites host; this reconciliation does not verify an active hosted release, its configuration or a public URL. No deployment performed. Independent-host auth/storage and fresh-machine install remain open. |
| Security | Owner-filtered database access, selected-document access checks, input limits, origin checks on writes, escaped source display. [Auth helper](app/chatgpt-auth.ts), [loopback-only development identity middleware](build/sites-vite-plugin.ts). | These controls are visible in code; earlier unauthenticated local review check returned 401. No hosted two-account adversarial test, comprehensive CSRF/rate-limit/resource-abuse audit or production threat-model validation. Production routes trust platform identity headers: an alternative host must strip/verify them at a trusted boundary. Local mock identity is not production authentication. |

## Evaluation independence audit

Inspected the corpus, labels, runner, saved measurements, UI and test assertions—not just reported percentages:

1. [lib/development.ts](lib/development.ts) imports the original 12 labels from [lib/samples.ts](lib/samples.ts), adds 18 hand-authored questions and six unsupported probes. All answerable labels reference the bundled fictional sample corpus. Uploaded PDF/DOCX parser fixtures and browser scenarios are not an independent answer benchmark.
2. [scripts/evaluate-semantic.mjs](scripts/evaluate-semantic.mjs) evaluates those same development questions/probes against those same samples. It writes `lib/retrieval-report.json`; [prepare-semantic](scripts/prepare-semantic.mjs) copies the report to `public/evaluation/retrieval-comparison.json`. The two report files are byte-identical at inspection, not separate evaluations.
3. [tests/retrieval.test.ts](tests/retrieval.test.ts) imports these labels, validates the live keyword baseline against the saved report and asserts that the saved semantic MRR exceeds keyword MRR. It does **not** rerun full model inference when the ordinary software suite passes.
4. [README's semantic experiment](README.md#local-semantic-retrieval-experiment) explicitly uses these development results to retain semantic search and withhold hybrid from the UI. These data/results have already been inspected and used in method selection. They cannot now be renamed held-out. The six unsupported probes are also exposed development data.

Saved Node CPU report (`date: 2026-10-18T16:42:49.864Z`), not rerun during reconciliation:

| Method | Recall@1 | Recall@3 | Recall@5 | MRR | Unsupported probes returning results |
|---|---:|---:|---:|---:|---:|
| BM25 | 60.0% | 70.0% | 70.0% | 0.650 | 2/6 |
| MiniLM semantic | 90.0% | 100.0% | 100.0% | 0.939 | 6/6 |
| RRF hybrid | 70.0% | 93.3% | 100.0% | 0.826 | 6/6 |

These are passage-ranking metrics over 30 answerable questions, each with one labelled passage. They do not measure answer correctness, entailment, calibrated confidence or refusal. Returning a result for an unsupported query is a warning about support decisions, not a measured hallucination: there is no answer generator. No evidence of a never-used held-out set was found; benchmark provenance and future separation must be documented before claiming independence. Independence from development also does not establish that documents were absent from a pretrained model's training data.

## Verification ledger and documentation precedence

- **Rerun for this reconciliation:** `node scripts/test.mjs` — 89 passed, zero failures; `tsc --noEmit` — exit 0. Local logs: `outputs/reconciliation-20261019/tests.log` and `typecheck.log`. No application features, runtime data, model weights or evaluation labels were changed.
- **Earlier recorded checks, not rerun:** 21 headed Chromium browser tests (0 failed/skipped/flaky); production build; extracted-copy 85 tests/build/typecheck/four migrations plus repeat no-op. See [release checkpoint](docs/RELEASE_CHECKPOINT.md), local `outputs/release-regression-final/browser-results.json` and the ZIP's verification receipt. The difference between 85 and 89 is four later backup tests.
- **Later local tools:** [LOCAL_TOOLS_VERIFICATION.md](docs/LOCAL_TOOLS_VERIFICATION.md) covers launcher and backup/restore limits. [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) remains the operating guide; [VERIFICATION_HISTORY.md](docs/VERIFICATION_HISTORY.md) preserves increment detail; [PORTABILITY_AUDIT.md](docs/PORTABILITY_AUDIT.md) is the earlier Linux/source audit.
- README's old test counts, “browser unavailable” paragraphs, single-table architecture description and “Next increments” list describe earlier stages. They are not the current status. The old release report's blanket “backups unverified” boundary predates the limited local backup checks; hosted/disaster recovery is still unverified.
- Passing local checks establishes the tested software behaviors only. No independent answer/retrieval/conflict accuracy or enterprise-readiness claim is supported.

## Git checkpoint and preservation

[GIT_CHECKPOINT.md](docs/GIT_CHECKPOINT.md) records the actual Git inspection and provenance. `git status --short --branch` returned “not a git repository”; there is no current HEAD, branch, index or trustworthy Git diff. `SOURCE-SNAPSHOT.json` records upstream export commit `98a3fa8b245cdfa15d7df52675757bae010ef23a`, **not a commit containing the current workspace**. No repository was initialized and no changes were discarded or represented as committed. A separate source hash manifest records the reconciliation state; existing archives and data are preserved.

## Python/FastAPI learning gap

The application is TypeScript/React with Node tooling and a Cloudflare Worker/D1/R2 backend. [generate-fixtures.py](scripts/generate-fixtures.py) creates ingestion fixtures; it is not a Python ML evaluation pipeline. No Python evaluation package, reproducible Python environment, FastAPI endpoints, Pydantic request/response models or Python API integration tests were found. Existing HTTP routes demonstrate backend work but do not meet a Python/FastAPI learning goal.

Use a small offline Python evaluator for the next milestone's exported predictions and labels; learn metric design, dataset validation and error analysis without moving the application. Later, add a narrowly scoped FastAPI search/answer contract only if it serves a concrete API requirement, with parity tests and an explicit authenticated storage boundary. Keep the existing UI and persistence. A framework rewrite does not close the current answering or evaluation gaps.

## Recommended next milestone

**Grounded extractive answering with explicit refusal and an evaluation protocol fixed before tuning.** It is the first milestone in [ROADMAP.md](ROADMAP.md#next-milestone), with concrete acceptance criteria. No implementation of that milestone is included in this reconciliation.
