# Policy Atlas

Enterprise Policy & Compliance Intelligence Assistant — first retrieval release for Mufeedh Ahmed.

**Current project inventory:** [PROJECT_STATUS.md](PROJECT_STATUS.md). **Remaining original requirements and next milestone:** [ROADMAP.md](ROADMAP.md). The goal is an AI/ML engineering internship portfolio with learning alongside implementation, using free additional services. The increment descriptions and test counts below retain historical context; the status file takes precedence for current capability and verification claims.

## Implemented
- Private hosted web application with owner-scoped persisted uploads in D1.
- Six bundled fictional policy versions across four policy families; one historical version and one draft.
- TXT, PDF and DOCX uploads with manual metadata, exact-file/extracted-text duplicate detection, version identity uniqueness, original-file downloads and extracted-text downloads. See the ingestion increment below for format limits.
- BM25 retrieval (k1=1.2, b=0.75) over blank-line-separated sections with original 1-based line ranges. Each filtered corpus supplies its own IDF statistics.
- Approval-status, department and effective-date filters; start inclusive / end exclusive. Approval lifecycle status and validity period are distinct. Overlaps are flagged, never silently resolved.
- Complete evidence passages, source inspector, line highlights and explicitly non-confidence ranking scores.
- On-demand development evaluation against bundled documents only.

## Deliberate limitations
No LLM calls, generated advice, OCR, explicit synonym expansion, exhaustive conflict inference, held-out evaluation, or enterprise security certification. Optional local embeddings are described below. Blank-line grouping is suitable for the initial controlled TXT documents, not an arbitrary policy parser. Search returns lexical matches, not determinations of applicability or compliance. Manual metadata is not automatically extracted or verified. Text download preserves decoded text, not necessarily original file bytes/BOM. SHA-256 hashes the decoded UTF-8 text re-encoded as UTF-8, not a raw upload byte archive. The database retains complete extracted text and R2 retains originals for new uploads. The prototype should be used with synthetic, non-sensitive material.

## Architecture
Browser → owner-authenticated `/api/documents` and `/api/conflict-reviews` routes → D1 via Drizzle, with originals in R2. Retrieval and evaluation execute in the browser over the owner's loaded library. The original hosting design relies on private Site access and trusted identity headers; current hosted security has not been independently verified. Database access is scoped to the platform user ID. Browser filtering is not an authorization boundary: the API only loads authorized owner records. No arbitrary document HTML is rendered. Shared bundled samples are code fixtures. Separate tables store document versions and conflict reviews; document_id groups a policy, version labels its edition, row UUID identifies a stored version, content_hash detects identical decoded text.

## Development

See [the local setup guide](docs/LOCAL_SETUP.md) for complete Windows/PowerShell commands, development sign-in, local database migrations, troubleshooting and deployment boundaries. Use the checked-in pnpm lockfile. The original hosted checkout retains its managed execution profile; a clean clone/export defaults to portable Node scripts.

Windows users can run `Policy-Atlas.cmd` after dependency installation to start the app or back up/restore local data. See [launcher and backup instructions](docs/LOCAL_SETUP.md#windows-launcher-and-local-backups). Backups include private uploads and notes; stop all local servers before copying or restoring state.

From a clean committed Git checkout, `pnpm export:source` creates a source ZIP excluding secrets/runtime state and removes the hosted Site project ID from the exported manifest. This is code export, not a backup of uploaded documents or saved reviews. See [the portability audit](docs/PORTABILITY_AUDIT.md) for verified checks and remaining limits.

For an exported working folder without Git metadata, `pnpm export:checkpoint` creates a separate allowlisted archive with per-file hashes and explicit working-folder provenance. `pnpm verify:checkpoint path.zip` verifies those payload hashes. See [the release checkpoint](docs/RELEASE_CHECKPOINT.md) for the current verification and remaining boundaries.

## Verification
Current Windows release checks are recorded in [RELEASE_CHECKPOINT.md](docs/RELEASE_CHECKPOINT.md), with setup commands in [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) and dated checks in [VERIFICATION_HISTORY.md](docs/VERIFICATION_HISTORY.md): conflict-review persistence; TXT/PDF/DOCX ingestion and original downloads; upload rejection and scan warnings; and real browser WASM semantic inference, cancellation and keyword fallback. Tests use headed Chromium with local synthetic data and video recording. The increment-specific statements below describe their original verification boundaries; the local setup guide records subsequent checks and remaining limits.

The original 17 automated tests cover source ranges, CRLF and whitespace separators, EOF, multiline VPN evidence, empty queries, case normalization, version cutoffs, draft/department filters, no hits, negation tokens, overlaps, valid dates, real evaluation labels, upload validation, and synthetic defaults.
The 12 hand-authored development queries each have one labelled passage. On the initial corpus: Recall@1/3/5 = 100%, MRR = 1.000. These simple checks overlap with the implementation's sample vocabulary and are NOT evidence of generalization. No held-out result is claimed. Uploads are excluded from evaluation to keep runs reproducible.
Historical note: browser QA was unavailable for the initial increment. Later Windows browser checks are recorded in the linked reports; type/build/test checks do not replace interactive browser testing or production API end-to-end testing.

## Try it
1. Search `VPN device` and open the source citation: both lines of the rule are returned.
2. Search `remote days manager approval` on 2026-06-30 and 2026-07-01: version 1.0 permits two days, version 2.0 permits three.
3. Search `hardware` with approved status: no result; choose draft review mode to see the unapproved proposal.
4. Upload a fictional TXT policy with a new ID; refresh and inspect/download it. Re-upload identical text to exercise duplicate handling. Delete your upload when finished.

## Next increments
Use [ROADMAP.md](ROADMAP.md) for the ordered remaining requirements. Grounded extractive answering, explicit refusal and an evaluation protocol fixed before tuning are the recommended next milestone. Several items in older increment plans, including semantic retrieval and potential-conflict review, already exist. All additional services must remain free.

## PDF / DOCX ingestion increment
Text-based PDF and DOCX upload is now implemented. Extraction is lazy-loaded in the browser using PDF.js 6.4.299 and Mammoth 1.13.0; no file or text is sent to a hosted model. The upload modal has a read → inspect → save flow. PDF citations use physical page numbers and extracted line numbers; DOCX citations use extracted body paragraph ordinals, never Word page numbers. PDF retrieval units are pages, DOCX units are paragraphs, TXT units remain blank-line sections.

Original bytes are stored in private R2 object storage and served through an owner-scoped download endpoint. Extracted text, provenance and metadata stay in D1. New uploads have both raw-file SHA-256 and decoded/extracted-text SHA-256; either an identical original or identical extracted text causes duplicate rejection. Legacy uploaded TXT records remain readable without a data backfill; originals cannot be reconstructed byte-for-byte for those records.

Limits: TXT 512 KB; PDF/DOCX 5 MB; PDF 100 pages; DOCX 3,000 extracted paragraphs; extracted text 512 KB per file and 4 MB across uploads; 100 uploaded versions. DOCX archive metadata is preflighted for required package entries and bounded advertised uncompressed size (20 MB total, 8 MB per entry, 2,000 entries). These prototype guards are not an enterprise malware scanner. Password-protected, damaged, unsupported and wholly unreadable files are rejected. Pages with under 20 non-whitespace characters receive a cautious warning: they may be blank, scanned or require OCR. Mixed PDFs may be saved after acknowledging omitted image text. No OCR is implemented.

Important limitations: PDF columns/tables may have incorrect reading order; images/diagrams are not interpreted. DOCX layout, headers, footers, comments, text boxes and tracked-change history may be missing. The source inspector displays escaped extracted text, not rendered HTML. Client extraction is validated structurally on the server but not independently re-extracted there; provenance represents parser output, not cryptographic proof of its correspondence to the file. A metadata update and object-store deletion do not form a distributed transaction; operational cleanup hardening remains future work.

The schema change is additive: format defaults to txt, and extraction/original reference columns are nullable. Existing policies and their source references are preserved. The baseline evaluation still uses only bundled TXT fixtures, so scores remain directly comparable. PDF/DOCX diagnostic tests are separate.

Verification for this increment: 32 tests pass, including real PDF/DOCX parsing, mixed and image-only PDFs, protected PDF rejection, provenance numbering, upload bounds and all 17 earlier checks. Typecheck and production build are also required before publication. Browser automation remains unavailable, so end-to-end interaction and hosted upload/download are not claimed as tested.

Try the fictional files linked inside the upload dialog. They are not automatically added to the evaluation corpus. Use a new document ID such as TEST-TRAVEL and mark them synthetic.

## Local semantic retrieval experiment
Keyword BM25 stays the default. Optional meaning-based retrieval now embeds queries and filtered document windows in a browser Web Worker. There are no external embedding calls, no LLM generation, and no provider key. The Site serves pinned Apache-2.0 MiniLM weights and a standalone Transformers.js runtime plus WASM; allowRemoteModels=false and explicit same-origin WASM paths prevent runtime model-provider fetches. Initial download is approximately 45 MB; cold loading and CPU inference can be slow. Browser cache availability varies. Native browser-worker WASM execution still requires user verification because browser automation is unavailable here. Errors and a three-minute timeout offer keyword fallback; switching mode cancels active work.

Model: Xenova/all-MiniLM-L6-v2, revision 751bff37182d3f1213fa05d7196b954e230abad9, q8 ONNX, 384 dimensions, mean pooling, L2 normalization. Asset SHA-256 fingerprints and source/license metadata are in public/models/minilm/provenance.json. The standalone fully bundled transformers.min.js is used; transformers.web.min.js is intentionally not used because it retains bare runtime imports unsuitable for a static browser worker. Build preparation synchronizes vendor runtime/WASM versions with the installed package.

Retrieval applies identical date/status/department filters before embedding. Long passages use 180-word windows with 32-word overlap; the maximum window cosine is the parent passage score. Full original evidence and provenance are retained for inspection. Limits: 500 windows per search, top 10 semantic candidates. Worker vectors cache only in memory; the worker is disposed when the library changes or the page unmounts. Model assets may be cached on device. Similarity is not confidence, support, policy interpretation, or a permission decision. No similarity abstention threshold is claimed. All six unsupported development probes produced semantic candidates, prominently disclosed in the UI.

Evaluation is now 30 answerable development questions (original 12 plus 18 paraphrase, scope, exception and historical cases), with 6 separate unsupported probes. Each answerable question has one labelled passage. Only bundled synthetic documents are used. Saved results are in lib/retrieval-report.json and downloadable from the retrieval checks page. In the measured Node CPU run:

| Method | Recall@1 | Recall@3 | Recall@5 | MRR | Unsupported probes with results |
|---|---:|---:|---:|---:|---:|
| BM25 | 60.0% | 70.0% | 70.0% | 0.650 | 2/6 |
| Semantic | 90.0% | 100.0% | 100.0% | 0.939 | 6/6 |
| RRF hybrid (fixed k=60, depth=20) | 70.0% | 93.3% | 100.0% | 0.826 | 6/6 |

Semantic improved the development metrics and is retained as an optional experiment; hybrid underperformed semantic and is not exposed in the UI. These are development measurements, not held-out generalization evidence. The original 12 literal tests still achieve Recall@1/3/5=100% for BM25; the lower expanded baseline is not a regression on those queries. Node CPU runtime timing is not a browser performance benchmark. CPU and WASM quantization may produce small ranking differences. Retrieval from a large or real enterprise corpus is unvalidated. Held-out release evaluation remains pending.

Reproduce after installing dependencies: `pnpm test` then `node scripts/evaluate-semantic.mjs`. This loads pinned local weights with no remote downloads, writes the report, and records method configuration and individual ranks. Model assets are checked in, not fetched during normal builds. The current suite has 40 tests covering the earlier ingestion checks, windowing, filter consistency, provenance retention, fusion, numerical dimensions, live-vs-saved keyword metrics and standalone asset configuration. Typecheck and production build are also run before publication.

## Evidence-linked version comparison
A new Version comparison view groups editions by document ID. Users explicitly choose Before and After versions; search date/status filters are deliberately not applied. All choices show approval state and effective date. Draft/archive comparisons and reverse-chronology selection have visible notices. The bundled Remote Work Policy v1.0 → v2.0 is the default example.

The comparison algorithm normalizes CRLF and ignores a single final newline, then computes exact-line LCS after trimming common prefixes/suffixes. Case, punctuation and internal whitespace remain significant. A remaining span above 1,000,000 DP cells uses a labelled coarse deletion/addition fallback. Adjacent removed/added lines form an edited text block; moved text may appear as removal plus addition. No semantic or legal interpretation is inferred. Blank lines may appear in counts. Identical text can still have differing metadata or authority.

Evidence retains original TXT line numbers, PDF physical pages plus extracted lines, or DOCX extracted paragraph ordinals. Clicking a line opens that exact version in the existing source inspector. PDF page wraps or DOCX extraction artifacts can create text differences; users should inspect original files. The UI previews up to 200 lines per side per block; the locally generated JSON export contains the full comparison, source references, selected version metadata, method, and limitations. No document data or diff is sent to an external service; no model is loaded for comparison.

Verification: all 52 tests pass. The 12 new tests cover the bundled policy changes, reconstructing each input from the diff, newline normalization, significant whitespace, line positions after insertion, reverse direction, family/identity checks, bounded fallback, PDF/DOCX provenance, repeated lines, empty text, and 60 deterministic randomized sequence pairs. Existing 40 ingestion/retrieval checks remain green. Typecheck and production build are required before publication. Interactive browser comparison remains unverified in this execution environment.

## Potential-conflict review (bounded, no model calls)
The new Conflict review view compares two explicitly selected accessible documents. It offers a private library mode plus six fictional examples kept separate from the search corpus and retrieval evaluation. Checks cover explicit weekly remote-work maximums, domestic daily meal amounts in the same currency, incident reporting within minutes/hours (hours normalized to minutes), and explicit personal-cloud-storage permission/prohibition for customer data. Pattern descriptions are visible in the UI. Numeric vocabulary and scope parsing are intentionally narrow and English-only; each document is limited to 200 extracted constraints and 50 comparable pairs across the selection, with explicit errors above the limits. Evidence previews and export excerpts are bounded at 3,000 characters and link to the complete source.

A differing matched value is classified for review using recorded effective periods, approval state, recognized explicit scope exclusions, selected date, conditions and deadline anchors. Categories: potential disagreement, historical change, draft/archived comparison, different explicit scope, outside review date, and context needed. Equal extracted values are inspectable but do not prove consistent conditions. No comparable pattern never means conflict-free. No document authority/precedence is inferred. Department is not used as employee applicability. Exceptions, PDF page context and unparsed wording may cause false positives/negatives. Source documents and human judgment remain necessary.

Findings display the extracted values and cited passages from both documents, plus dates, status, scope excerpts and unknown authority. The source inspector retains TXT lines, PDF page/extracted lines or DOCX paragraph references. No embedding or generative model is invoked for this feature. The frontend computes candidates; it does not make legal/compliance determinations or silently resolve conflicts.

Human assessments and notes (up to 3,000 characters) are persisted in conflict_reviews. The key is owner + unordered document pair + review date. GET/POST routes require the platform's user identity, verify access to both selected documents, and never use email as an owner key. Notes default to Needs review and are only saved on an explicit action. Signature changes in source content/applicability reset the displayed status to Needs review and show a stale notice. The current implementation stores the latest assessment, not an immutable review history. Saves require the revision loaded by the client; atomic database conditions reject competing writes with HTTP 409. The UI preserves the rejected draft for export and requires reloading before another save. Navigation/selection guards warn about unsaved notes; JSON exports mark unsaved state. Deleting an uploaded source removes related review records in the same D1 batch as its metadata deletion. File object deletion remains a separate storage operation, as documented earlier.

The additive migration creates one review table and unique owner/pair/date index; document tables and baseline fixtures are unchanged. Synthetic example sources can be inspected but are not silently inserted into the main library. The example scenarios demonstrate overlap, historical cutoff, scope difference, draft status, equivalent units and conditional exception language.

Verification: 75 tests pass (all earlier 52 plus 23 new conflict/review tests). New checks cover temporal boundaries, status exclusions, explicit scope, unknown scope, department non-inference, currency separation, unit conversion, exception and anchor uncertainty, negation, unsupported topics, source provenance, constraint limits, pair/signature symmetry and invalid review inputs. These are diagnostics, not an independent conflict-detection benchmark. Typecheck and production build are run before publication. Browser save/reload and private-account isolation still require end-to-end verification; service-only Site credentials do not impersonate a signed-in visitor and are not used to bypass owner checks.
