# Git and source checkpoint — reconciliation 2026-10-19

## Actual Git state

Executed `git status --short --branch` from `D:\Mufee\Projects\policy-atlas-source\policy-atlas`: exit 128, `fatal: not a git repository (or any of the parent directories): .git`. The workspace and inspected parent locations have no `.git` entry. Therefore HEAD, branch, index, remotes, staged/unstaged status and a Git diff cannot be recorded here. No new Git commit exists for this reconciliation. No `git init`, reset, clean, checkout or history rewrite was performed.

This records the missing Git checkpoint explicitly rather than treating source-export metadata as a live repository. Recovering the original repository or deliberately initializing local history is separate future work; the current application and all pre-existing modifications are preserved.

## Existing provenance and artifacts

- [Root SOURCE-SNAPSHOT.json](../SOURCE-SNAPSHOT.json) records export provenance commit `98a3fa8b245cdfa15d7df52675757bae010ef23a`, exported at `2026-10-19T01:42:05.794Z`. It does not describe the current working folder after subsequent changes. The older [portability audit](PORTABILITY_AUDIT.md) references an earlier tested application snapshot; that is also historical, not current HEAD.
- Existing archive: `exports/policy-atlas-portfolio-checkpoint-2026-10-19.zip`; SHA-256 `eb36c1d815f8d69421ad907484ed04f353994c7f55740b77108839e7ac25e9e1`. Its receipt identifies 202 source files and `commit: null`, with the above upstream commit as provenance. It predates the launcher/backup increment and this reconciliation. It is retained unchanged.
- Before reconciliation documentation edits, comparison with that archive found changed `README.md`, `docs/LOCAL_SETUP.md`, `scripts/checkpoint-utils.mjs` and `scripts/test.mjs`, plus later launcher/backup sources/tests/documentation. These are preserved. This is archive comparison, not a Git diff.

## Reconciliation fingerprint

[RECONCILIATION_CHECKPOINT.json](RECONCILIATION_CHECKPOINT.json) records a sorted per-file SHA-256 manifest for the source allowlist plus the new root `PROJECT_STATUS.md` and `ROADMAP.md`. It also records changed/added/deleted paths relative to the existing archive. Its aggregate hash covers the serialized `files` array; it is an integrity fingerprint, not a signed publisher identity or Git commit.

The manifest excludes itself to avoid a self-referential hash. Runtime uploads/reviews, credentials, dependencies, local tools, generated build/test output and archives are excluded. No private data is embedded. It is not a backup; the earlier [local backup verification](LOCAL_TOOLS_VERIFICATION.md) describes the separate data snapshot. Root status/roadmap files are explicitly included in this manifest; the existing checkpoint ZIP exporter's root-file allowlist does not yet include them, and was not changed during this documentation-only reconciliation.

Only documentation was edited for this reconciliation: the two root planning files, this checkpoint note/manifest, and documentation links/precedence notices. Tests/typecheck generated ignored local outputs. No application feature, dependency, evaluation label/report, model, database, upload or existing source ZIP was changed. Reconciliation tests passed 89/89; TypeScript checking passed. Build and browser results remain earlier evidence, not new runs.
