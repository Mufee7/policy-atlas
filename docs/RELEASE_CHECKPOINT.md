# Policy Atlas portfolio checkpoint — 2026-10-19

Historical release evidence for the ZIP named below. [PROJECT_STATUS.md](../PROJECT_STATUS.md) is the authoritative current inventory; later launcher/backup checks are recorded in [LOCAL_TOOLS_VERIFICATION.md](LOCAL_TOOLS_VERIFICATION.md). This report's results remain tied to its original checkpoint.

This checkpoint packages the existing local prototype; it does not publish a Site or claim enterprise readiness. No paid model service is configured or required.

## Verification status

- Windows: Node 24.22.0, pnpm 11.25.0, Playwright 1.64.0 and bundled Chromium.
- 85 automated tests passed, including checkpoint exclusions, archive payload integrity and the original ingestion/retrieval/comparison/review checks.
- TypeScript checking and the production build passed.
- All four local migrations are applied; rerunning the helper reported no pending migrations. Hosted data was not changed.
- The combined headed browser run passed all 21 tests in 9.1 minutes, with zero failures, skipped tests or flaky results. This includes version selection, evidence inspection, note saving and persistence after refresh.
- Post-packaging clean-copy checks are recorded in the verification receipt beside the delivered ZIP; this report records the workspace checks before packaging.

Browser tests use the normal loopback-only development sign-in, `slowMo: 800`, videos and a 10-second pause after each test. The release run writes videos and screenshots under `outputs/release-regression-final/browser/` and a JSON result report to `outputs/release-regression-final/browser-results.json`. These runtime artifacts are intentionally excluded from source archives.

The initial combined run was interrupted after a Windows watcher error on a generated verification copy. The dev watcher now ignores project-local tools, verification work, exports, recordings, runtime state and build output; authored source remains watched. All 21 tests passed after this fix. A separate probe held an exclusive lock on a generated file for two seconds; the development server remained responsive with HTTP 200.

## Source packaging

This working folder originated from a source export and has no Git metadata. `pnpm.cmd export:checkpoint` creates an allowlisted working-folder ZIP, not a new Git commit. The embedded `SOURCE-SNAPSHOT.json` records `commit: null`, upstream export provenance, per-file SHA-256 hashes and a content-manifest hash. Export preparation removes the hosted project ID from `.openai/hosting.json` and verifies the compressed payloads before writing the ZIP. The committed-only `export:source` command remains available for real Git checkouts.

The checkpoint excludes local uploads/review notes, database/object-store state, recordings, credentials/runtime directories, installed dependencies and portable tool/browser downloads. It retains application and test sources, all four migrations, the dependency lockfile, bundled fictional samples, pinned local model assets and third-party licenses. The archive is not a private-data backup.

The delivered archive is `exports/policy-atlas-portfolio-checkpoint-2026-10-19.zip`. Its adjacent `.verification.json` and `.sha256` files record the exact archive hash and completed extracted-copy checks. Dependency installation for that copy used the existing local pnpm cache with the frozen lockfile: 708 packages reused and zero downloaded. This does not verify a fresh network installation on another computer.

## Reproduce

Follow [LOCAL_SETUP.md](LOCAL_SETUP.md), then run:

```powershell
pnpm.cmd test
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd local:db
pnpm.cmd test:browser
```

Install Chromium once with `pnpm.cmd exec playwright install chromium` on a new machine. Tests leave labelled synthetic documents and notes in the local database. Read [VERIFICATION_HISTORY.md](VERIFICATION_HISTORY.md) for individual checkpoints, simulated failure conditions and recorded limitations.

## Remaining boundaries

- Hosted authentication and two-account isolation, backups and alternative-host deployment have not been verified.
- The suite covers desktop Chromium and two narrow desktop viewports, not physical phones, Safari/Firefox, screen-reader behavior or full WCAG compliance.
- Independent held-out retrieval/conflict accuracy, real enterprise documents and complex PDF/DOCX layouts remain unvalidated. No generative answers or OCR have been added.
- Dedicated version-comparison UI interaction, real source-deletion/mutation races, encrypted DOCX and every parser/browser limit are not covered by this browser suite.
- Review revisions prevent stale saves, but there is still no immutable review history. Three-minute semantic timeout, worker crashes and offline cache reliability remain browser-verification gaps.
- The source retains upstream third-party notices. A project-wide public-source license still needs the author's decision before public redistribution.
