# Windows launcher and local backup verification — 2026-10-19

This increment follows the source ZIP described in RELEASE_CHECKPOINT.md. That earlier ZIP is unchanged and does not contain these new tools.

## Verified

- All 89 automated tests passed (the earlier 85 plus four backup/restore tests); TypeScript checking passed.
- Launcher setup check found portable Node 24.22.0 and installed dependencies. Start applied the local migration helper (no pending migrations), started the development server and returned HTTP 200 on port 5173.
- Created `exports/local-backup-verified-20261019` from the stopped workspace emulator. Every database/object-store payload hash was verified.
- Restored that backup to the isolated `work/backup-restore-verification/state` directory. The emulator opened its database successfully and returned 9 documents and 9 conflict reviews. The active workspace state was not replaced.
- Automated tests verify byte preservation, restore into an empty destination, preservation of previous destination contents in a rollback directory, corrupt-backup rejection before replacement and unsafe-path rejection.
- A live-server probe confirmed backup rejects a listening port 5173 before creating the destination.

## Limits

- No new browser run was performed for these command-line tools. The prior 21 browser checks remain the evidence for app interactions; they were not rerun for this increment.
- A full replacement of the user's active state was deliberately not performed. Replacement and rollback preservation were exercised with synthetic temporary state; the real snapshot was restored only to an isolated destination.
- No fresh-machine install, network-share backup, power-loss recovery, cross-version emulator compatibility, encrypted storage or hosted backup/restore is claimed.
- All servers must stay stopped during backup/restore. Port probes cover 5173 and 8787 only; the explicit stopped confirmation also applies to custom ports. Hashes detect corruption, not a maliciously replaced backup and manifest.
- The launcher startup path was exercised through PowerShell with the same process-only execution-policy option used by the `.cmd` entry. Explorer double-click and interactive restore-menu entry were not separately automated.
