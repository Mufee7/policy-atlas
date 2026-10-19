# Minimal local binding configuration migration

Starting behavioral checkpoint: `b806210`. Scope: move the two non-secret storage binding names from `.openai/hosting.json` to root `local-bindings.json`; remove only the obsolete build hook that emitted `dist/.openai` hosting metadata/migrations. Connectors, UI components, managed tooling and local identity middleware remain in place.

Vite, database diagnostics, source/checkpoint exporters and their tests use the neutral configuration. Checkpoint archives require it; both new export formats exclude every `.openai` path. Read-only verification of historical checkpoints still accepts their exact legacy manifest path; this does not restore a runtime dependency. Generic stripping of a supplied `project_id` remains an export safeguard. `.gitignore` excludes the legacy directory entirely. Historical source snapshots, frozen evaluation manifests and raw predictions/labels/scores are unchanged.

Storage binding values `DB`/`BUCKET`, placeholder database UUID, emulator names `site-creator-d1`/`site-creator-r2`, `.wrangler/state`, `local_seedy`, cookie/routes/header names and the complete loopback sign-in middleware are preserved. Third-party licenses and upstream middleware attribution remain unchanged. No user data migration or authentication redesign is performed.

The pre-existing portfolio README, career/demo/architecture drafts, screenshots and Git-checkpoint path sanitization are separate uncommitted work and are not included in this cleanup checkpoint.

## Verification

Verified on Windows using Node 24.22.0 / Python 3.13.13:

- 101 software tests passed (100 existing plus historical-checkpoint compatibility), seven Python evaluator unit tests passed, TypeScript checking and production build passed. No frozen final inference/scoring or tuning was run.
- The complete `configureServer` sign-in middleware is byte-identical to `b806210`. The built D1/R2 names and database UUID match the old configuration; build output no longer contains `dist/.openai`.
- A stopped-server snapshot was restored only into `work/local-config-migration/app/.wrangler/state`. Local migration startup reported no migrations to apply. Its app listener was `127.0.0.1:5173`.
- Read-only HTTP checks matched all 11 saved documents, all 11 original-download SHA-256 values and all 10 review-note texts/statuses/revisions. Forged identity headers without a cookie returned 401; with the local cookie they did not override `local_seedy`. Cross-origin sign-in and writes returned 403; an external return URL was constrained to `/`. The temporary server was stopped. No new browser rehearsal is claimed for this configuration-only change.
- All 22 active-library state-file sizes/hashes remained identical to the verified snapshot. The first backup copy was inadvertently opened with writable SQLite inspection, which added sidecars; the integrity guard rejected it. A fresh, untouched backup verified/restored successfully. No manifest was weakened and the active library was not replaced.
- Source export and checkpoint creation/verification passed from a separate clean temporary Git snapshot of the migrated source (excluding portfolio drafts). Both ZIPs contained neutral bindings, retained license/evaluation files, and excluded legacy config and private/runtime paths. The existing historical `policy-atlas-portfolio-checkpoint-2026-10-19.zip` also verified (202 files).
- Artifacts are private/ignored under `work/local-config-migration/`; they are verification data, not a published release or user-data migration. Fresh-machine setup, hosted authentication and cross-version recovery remain outside these checks.

Historical snapshots/freeze manifests, raw evaluation records, answer/retrieval/scorer code, connector/UI code and required licenses were compared against HEAD and remain unchanged. Pending README and Git-checkpoint draft bytes were preserved. No history rewrite, remote push or deployment occurred. Public deployment remains deferred and the identity-header findings in [the security review](DEPLOYMENT_SECURITY_REVIEW.md) remain unresolved.
