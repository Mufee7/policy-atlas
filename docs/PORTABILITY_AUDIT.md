# Source portability audit

The project now includes a clean committed-source ZIP exporter, a Windows-friendly local setup guide, and a Node-based local database migration helper. The exporter strips Site project identity and excludes secrets/runtime data; it preserves application code, lockfile, migrations, synthetic samples, evaluation data and licensed local model assets.

## Checks completed before clean export

- 78 automated tests pass.
- Export allowlist tests exclude secret/runtime/dependency paths and retain required source/model/license files.
- Exported hosting-manifest transformation preserves storage bindings and removes only project identity.
- Source export and local migration scripts parse successfully.

## Clean-export verification

Verified on 2026-10-19 against committed application snapshot `23927c65269dc7f30476fd72e45038235ba579d7`. The final handoff adds this report; application code is unchanged from that tested snapshot.

- The exporter produced a 181-file ZIP (23,157,611 bytes), with a containing `policy-atlas/` directory and a source-commit manifest.
- Inspection confirmed no Git metadata, runtime state or dependency directories, and no hosted project ID in the exported hosting manifest.
- Extracted into a fresh temporary directory without Git metadata or a managed execution profile. The portable build completed successfully.
- All 78 tests passed from that extracted directory.
- The local database helper applied all three migrations successfully. A second run reported no migrations to apply. No hosted database was modified.
- The audit reused the existing installed dependencies through a local symlink. A fresh network dependency installation was **not** tested. The symlink is not included in the ZIP.
- Tests/build ran on Linux with Node 24.19.0. Native Windows setup, browser sign-in and end-to-end local upload/search remain unverified manual checks.

The ZIP is a development checkpoint, not a claim that the full planned product or an independent public deployment is complete. Its `SOURCE-SNAPSHOT.json` identifies the final exported commit. Private uploaded files and saved review notes remain outside the source package.

## Boundaries

Local development uses emulated D1/R2 and a loopback-only mock sign-in. An alternative public deployment still requires trusted authentication, authorization and persistent storage configuration. No private uploads or review notes are included in source exports. Linux checks do not prove Windows browser behaviour; native Windows install/sign-in/upload/search remain manual checks.
