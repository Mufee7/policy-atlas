# Windows verification history

These dated development checkpoints record what was checked at each increment. Later checkpoints supersede earlier limitations. See [the release checkpoint](RELEASE_CHECKPOINT.md) for the combined release verification and remaining limits.

## Windows verification checkpoint (2026-10-19)

Verified in this source export on Windows with project-local Node 24.22.0 and pnpm 11.25.0: fresh frozen-lockfile dependency installation, all 78 tests, TypeScript checking, production build, all three local migrations and an idempotent second migration run. The Windows migration helper now converts its Node `--import` path to a file URL.

With `pnpm dev` running, this repeatable HTTP check uses the normal local development sign-in, reads both bundled Remote Work versions and their cited evidence, saves one labelled synthetic review, and verifies fresh reads including reversed selection:

```powershell
node scripts/verify-local-review.mjs http://127.0.0.1:5173
# After stopping and restarting pnpm dev, verify without saving again:
node scripts/verify-local-review.mjs http://127.0.0.1:5173 --read-only
```

Run `pnpm test` first; the check uses its compiled conflict engine. It refuses to overwrite a different existing note. The saved synthetic note uses Remote Work v1.0/v2.0 and review date `2026-10-19`. A server restart followed by the read-only check returned the original note, assessment and save timestamp. Unauthenticated review reads returned 401. The app homepage returned HTTP 200. These are HTTP integration results, not browser interaction results or multi-account isolation verification.

To finish interactive QA, open `http://127.0.0.1:5173/signin-with-chatgpt?return_to=/`, choose **Conflict review**, select **POL-001 v1.0** and **POL-001 v2.0**, and set the review date to **2026-10-19**. Open both evidence citations and check the highlighted original lines. The saved synthetic note should appear with **Historical change**. Edit the note, choose **Save review**, refresh, return to the same pair/date, and confirm the saved assessment and text. The view and selections currently reset on full page refresh, so reselect them. Browser clicks, source-drawer rendering and refresh were not tested by the agent because no browser was available to its browser-control tool.

## Automated browser verification (2026-10-19)

Playwright with local Chromium now verifies the conflict-review flow on Windows. It passed normal development sign-in, selecting Remote Work v1.0/v2.0, opening both evidence citations and checking highlighted original lines, saving an assessment and note, full refresh and reselection with the same note/status/save timestamp, reversed-pair persistence, and cancel/discard behavior for unsaved notes. No uncaught page errors were observed. The post-refresh screenshot was also visually inspected. This is one desktop Chromium workflow, not verification of uploads, semantic search, other browsers, mobile layouts or hosted multi-account isolation.

Enable the PATH described above and run (the test command reuses a server at **http://127.0.0.1:5173**, or starts a local dev server if needed):

```powershell
pnpm.cmd test:browser
```

Browser tests default to headed Chromium with `slowMo: 800`, record video, and keep the window open for 10 seconds after each test. Announce the run before launching it, as required by `AGENTS.md`. If visible desktop execution is unavailable, explain that before using headless execution and retain video or a trace.

The test uses the reserved synthetic review date **2099-12-30** to avoid overwriting the manual check dated 2026-10-19. It leaves a clearly labelled `PLAYWRIGHT-QA` note in local D1 and refuses to overwrite a different note at its test pair/date. The browser starts with a fresh session and signs in through the normal local development route. It does not mock review requests. The full-page screenshot is written to `outputs/playwright/review-after-refresh.png`; failure screenshots are also under `outputs/playwright`. Outputs and browser binaries are excluded from source exports.

For another checkout, first install locked dependencies, build and migrate the database as above, then install the free browser:

```powershell
pnpm.cmd exec playwright install chromium
```

This workspace already has the browser in `.tools/playwright`; the test config detects that folder automatically. No paid service or hosted browser is used.

This browser run supersedes the earlier HTTP checkpoint's browser-verification limitation above.

### TXT upload browser checkpoint

The headed Chromium upload test passed on Windows with `slowMo: 800`. It verified fictional TXT metadata, the extracted-text preview before saving, saving to the library, persistence after a full refresh, the source inspector, an original-file download byte-for-byte against the upload, keyword search and highlighted citation lines, and duplicate rejection (HTTP 409) when identical bytes were submitted with a different document ID. No uncaught page errors were observed. Extraction and duplicate-error screenshots were visually inspected. The upload UI now exposes a TXT preview before saving, matching the existing PDF/DOCX inspection flow.

```powershell
pnpm.cmd test:browser upload.spec.ts
```

The test creates a unique `QA-TXT-<timestamp>` fictional document per run and leaves it in local storage for inspection. Two synthetic uploads remain from the diagnostic and successful runs; no real documents were changed. The successful run's ID is `QA-TXT-1792380882916`. Video, screenshots and the downloaded original are under `outputs/playwright/upload-TXT-upload-extracti-2f963-ion-and-duplicate-rejection/`. Playwright clears its output directory when a new run starts, so copy artifacts you want to retain first.

All 78 existing tests, TypeScript checking and the production build passed after this change. This checkpoint covers TXT ingestion; PDF/DOCX browser ingestion, larger-file layouts, other browsers and hosted storage remain unverified by this run.

### PDF and DOCX browser checkpoint

Both headed Chromium tests passed on Windows with `slowMo: 800`, video recording, and a 10-second pause before each browser closed. The tests use the bundled fictional `travel-policy.pdf` and `access-policy.docx`. They verified:

- PDF extraction contains two physical pages; the meal-allowance evidence is on page 2.
- DOCX extraction contains seven paragraphs; the service-desk-portal evidence is in extracted paragraph 4.
- Saving requires explicitly acknowledging extraction limitations.
- Both uploads save successfully, retain metadata and extracted evidence after a full refresh, and return original downloads identical to the fixture bytes.
- Keyword search finds each source, and its citation opens the correct page/paragraph with the evidence highlighted.
- No uncaught page errors were observed. Both citation screenshots were visually inspected.

```powershell
pnpm.cmd test:browser documents.spec.ts --output outputs/playwright-documents
```

The local synthetic documents `QA-BROWSER-PDF` and `QA-BROWSER-DOCX` remain available for inspection. Repeat runs reuse these fixtures and check duplicate rejection instead of inserting copies; a different existing title at either test ID stops the test. No human documents are overwritten or deleted. Videos, screenshots and downloaded originals are under `outputs/playwright-documents/`, separate from the earlier TXT artifacts. Each new run using the same output directory clears that directory, so copy artifacts you want to keep first.

All 78 existing tests and TypeScript checking passed alongside these new browser tests. No application changes were needed in this increment. These two small, text-based fixtures do not establish correctness for scanned, encrypted, damaged, oversized or complex-layout documents. Those browser failure cases, other browsers and hosted account isolation remain pending.

### Upload failure and scan-warning browser checkpoint

Four headed Chromium tests passed, covering nine scenarios with `slowMo: 800`, video recording and a 10-second pause after each test:

- The bundled image-only PDF is rejected with an insufficient-text/OCR message.
- The bundled password-protected PDF is rejected with an explicit unsupported-password message.
- A deliberately broken PDF and DOCX archive, plus invalid UTF-8 TXT bytes, produce errors and cannot advance to Save document.
- Synthetic files one byte above the TXT 512 KB limit and PDF/DOCX 5 MB limit are rejected before upload.
- The bundled mixed-scan PDF shows the page-2 missing-text/OCR warning, requires acknowledgment before saving, and retains that warning after refresh in the search view, library badge and source inspector. The second page remains explicitly without searchable text.

All rejection checks observed zero POST requests to the document upload API. The PDF rejection test also compared library IDs before and after to confirm no records changed. This checks the browser's validation path; it is not a claim of exhaustive server-side adversarial testing. The encrypted-file error and persisted mixed-scan warning screenshots were visually inspected.

```powershell
pnpm.cmd test:browser upload-errors.spec.ts --output outputs/playwright-upload-errors
```

The mixed-scan fixture remains in local storage as `QA-BROWSER-MIXED`; repeat runs safely reuse the same labelled fixture. No rejected fixtures were saved. Videos and screenshots are under `outputs/playwright-upload-errors/`. Earlier TXT and PDF/DOCX artifact directories are preserved.

All 78 existing tests and TypeScript checking passed. No application changes were needed. Browser checks for page/paragraph limits, extracted-text and DOCX uncompressed-archive limits, complex layouts, encrypted DOCX, other browsers and hosted account isolation remain pending. No OCR has been added.

### Local semantic-search browser checkpoint

Three headed Chromium tests passed with `slowMo: 800`, video recording and a 10-second pause after each test. Real MiniLM inference ran in the browser's WASM worker from a fresh browser cache, returned the incident-reporting passage and opened its correctly highlighted source lines. Semantic results respected the Remote Work v1.0/v2.0 exclusive cutoff at 2026-07-01. Observed model and WASM requests used the app's loopback origin; the only external requests observed were the existing Google Fonts UI assets.

Two separate tests deliberately controlled the ONNX download through Playwright routing: a held download verified that Cancel returns to working BM25 results and terminates the worker; an aborted download verified that an explicit Use keyword search action restores working BM25 results. These failures were simulated; the inference and historical-filter check used the real model. An initial run lost its reused development server between tests; the complete successful run used a Playwright-managed dev server.

The failure test exposed a misleading state where model errors also displayed No matching evidence and raw runtime details. The app now displays Search unavailable and Meaning-based search could not finish, with a plain-language error and keyword fallback. The corrected failure display and the real inference citation screenshot were visually inspected. The final three-test run, all 78 existing tests, TypeScript checking and the production build passed.

```powershell
pnpm.cmd test:browser semantic.spec.ts --output outputs/playwright-semantic-final
```

Videos and screenshots from the final run are under `outputs/playwright-semantic-final/`. These tests do not establish retrieval accuracy on unseen questions, general browser performance, offline cache reliability, or support on other browsers/devices. The full three-minute timeout, worker crash and 500-window browser limit remain untested in the browser. No paid model service is used.

### Conflict-review recovery browser checkpoint

Four headed Chromium tests passed with `slowMo: 800`, video recording and a 10-second pause after each test:

- A simulated GET 503 disables notes, assessment and Save until Reload review succeeds against the real API. No POST is sent during the load failure.
- A simulated POST 503 retains the exact note and unsaved state. JSON export marks it unsaved. Retry save uses the real local API; note and assessment survive a full page refresh.
- A simulated GET 404 displays an unavailable-source error and blocks editing/saving. Separately, a real API GET with an unknown source ID returns 404.
- A simulated `stale: true` API response resets the displayed assessment to Needs review, retains the previous note, and shows the stale warning. A fresh human assessment saves through the real API and reads back with `stale: false`.

```powershell
pnpm.cmd test:browser review-errors.spec.ts --output outputs/playwright-review-errors
```

Videos, screenshots and an unsaved JSON export are under `outputs/playwright-review-errors/`. The failed-load and stale-assessment screenshots were visually inspected. The tests reserve Remote Work v1.0/v2.0 review dates 2099-12-27 (save retry) and 2099-12-26 (fresh reassessment); they refuse to overwrite different existing human notes. These two labelled synthetic notes remain in local D1. No documents were modified or deleted.

The four new browser tests and TypeScript checking passed. No application changes were needed. API outages, source disappearance in the UI and the stale flag were simulated; this is not a browser test of an actual database outage, deletion race or source-content mutation. Real persistence and the unknown-source API response were checked separately. Concurrent-edit protection/history and hosted account isolation remain pending; concurrent writes are still last-write-wins.

### Concurrent-review protection checkpoint

Review writes now require the revision loaded by the client. GET includes an opaque revision; POST requires `baseRevision` (the loaded revision, or explicit `null` when no review existed). A successful write generates a new revision. An insert that loses the unique owner/pair/date race or an update whose expected revision no longer matches returns HTTP 409 without changing the saved review. The revision condition is part of the database write, rather than a separate read-then-write check. Missing or malformed revisions are rejected, so older clients cannot bypass the guard.

When a save is rejected, the UI keeps the unsaved note, blocks further saves, and offers Reload review. Export review preserves the draft with `unsaved: true`; reload asks before discarding it. The reviewer can then inspect the latest note and manually combine changes. There is no automatic merge or immutable review history.

Migration `0003_easy_bruce_banner.sql` adds the revision column and initializes existing reviews from their UUID IDs. Existing notes and assessments are retained. Apply the migration before using the updated API:

```powershell
pnpm.cmd build
pnpm.cmd local:db
```

The migration applied successfully to local D1; a repeat reported no migrations to apply. No hosted database was changed. Any hosted release must apply the same additive migration before serving the updated API. Refresh old browser tabs after upgrading.

Verified: 79 automated tests, TypeScript checking and the production build passed. All seven review browser tests passed in a single final run, including the original review flow, four failure/recovery cases, a real two-tab overwrite rejection with draft export/reload/manual merge, and competing API creates and updates. Each race admitted exactly one write; stale revisions returned 409 and omitted revisions returned 400. The rejected-draft screenshot was visually inspected. Tests used headed Chromium, `slowMo: 800`, video recording and a 10-second pause after every test. The pause now uses an automatic fixture so it applies across multiple spec files.

```powershell
pnpm.cmd test:browser conflict-review.spec.ts review-errors.spec.ts review-concurrency.spec.ts --output outputs/playwright-review-revisions-final
```

Recordings, screenshots and the exported rejected draft are under `outputs/playwright-review-revisions-final/`. The two-tab test reserves review date 2099-12-24 and leaves a labelled synthetic merged note. API races create labelled synthetic reviews on otherwise-unused future dates; no human notes are overwritten. This checkpoint supersedes the earlier last-write-wins limitation. Hosted multi-account isolation, real deletion/source-mutation races and immutable history remain unverified or unimplemented as previously described.

### Keyboard, narrow layouts and long-document checkpoint

Four headed Chromium tests passed with `slowMo: 800`, video recording and the 10-second inspection pause:

- Keyboard search and Enter-to-open citations; Tab/Shift+Tab containment in source and upload dialogs; Escape dismissal and focus restoration to the opening control.
- At 320px and 375px viewport widths, the mobile menu reports its expanded state, focuses its close control, traps Tab navigation, closes with Escape or view selection, and restores focus. Review selectors fit the viewport, and the upload form has no horizontal overflow.
- A 30,214-byte fictional TXT with 80 numbered context sections, a long unbroken identifier and a final rule can be inspected in a wrapping, bounded preview. The preview is keyboard-focusable and End scrolls it. The document saves, its late rule is found by keyword search, and the source inspector highlights that rule without horizontal overflow at 375px.

The checks exposed missing mobile-menu state/focus handling, horizontal overflow in the long TXT preview, and upload form overflow at 320px. The app now provides a mobile menu close button/backdrop, keyboard containment, Escape dismissal, background focus isolation and focus return. All sidebar view selections close the menu. TXT previews wrap, scroll within a bounded region and accept keyboard focus. Upload metadata fields stack on screens up to 400px wide. The 320px upload screenshot and keyboard-scrolled long preview screenshot were visually inspected.

```powershell
pnpm.cmd test:browser usability.spec.ts --output outputs/playwright-usability-final
```

Screenshots and videos are under `outputs/playwright-usability-final/`. The final long-document fixture remains in local storage as `QA-LONG-1792383937982`; a labelled fixture from the diagnostic run also remains. No human documents were changed. All 79 automated tests, TypeScript checking and the production build passed. The four browser tests passed in a single final run.

These are desktop Chromium tests with narrow viewports, not physical-phone or mobile Safari verification. They are focused usability checks, not a screen-reader, contrast, zoom/reflow or full WCAG audit. A 30 KB synthetic TXT does not validate performance at every supported file limit or complex PDF/DOCX layouts. A final combined regression and source checkpoint remain next for the portfolio milestone.

## Earlier audit limits

The source audit records its exact checks in `docs/PORTABILITY_AUDIT.md`. A successful Linux clean-export build is not a Windows browser test or proof of independent public deployment. Windows interactive sign-in/upload/search and alternative-host authentication remain release checks.
