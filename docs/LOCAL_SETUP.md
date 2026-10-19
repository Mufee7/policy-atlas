# Run Policy Atlas locally

For current capabilities and remaining requirements, see [PROJECT_STATUS.md](../PROJECT_STATUS.md) and [ROADMAP.md](../ROADMAP.md). This file is the operating guide, not the project completion checklist.

This is a source checkpoint, not a claim that all planned product features are complete. The app currently supports ingestion, retrieval, comparison and bounded human conflict review. It does not generate AI answers.

## Requirements

- Node.js 24 (this Windows checkpoint uses 24.22.0; the package engine minimum is 22.13.0).
- pnpm 11.25.0. If needed: `npm.cmd install --global pnpm@11.25.0`.
- Git if cloning or producing source exports.
- Internet for the initial dependency installation. No paid model key or Cloudflare account is needed for local development.

Windows users can enter the commands below in VS Code's PowerShell terminal, from the extracted `policy-atlas` folder. Keep the dependency lockfile. Do not copy node_modules from another operating system.

If this workspace has the project-local portable tools installed in `.tools`, enable them for the current PowerShell terminal first:

```powershell
$env:PATH = "$PWD\.tools\node-v24.22.0-win-x64;$PWD\.tools\pnpm\node_modules\.bin;$env:PATH"
```

These tools are local setup artifacts, excluded from Git and source exports. A new terminal needs the PATH command again. Other checkouts can use a normal Node/pnpm installation instead.

## Install and check

```powershell
node --version
pnpm.cmd --version
pnpm.cmd install --frozen-lockfile
pnpm.cmd test
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd local:db
pnpm.cmd dev
```

`local:db` applies unapplied migrations to the local SQLite/D1 emulator under `.wrangler/state`. It always passes `--local`, uses a local-only generated config, and can be run again without replaying applied migrations. R2 file storage is emulated locally as well. It does not access the hosted database.

A clean export/clone defaults to the portable execution profile. The original managed checkout has an ignored profile selection; do not copy `.sites-runtime` into your own project. The development script explicitly binds `127.0.0.1` on port 5173 by default; Vite config also uses loopback for both profiles. The built preview explicitly uses `--ip 127.0.0.1`. Do not override the host, expose a tunnel or forward ports for this release. Open the loopback URL printed in the terminal.

## Windows launcher and local backups

After installing dependencies, double-click `Policy-Atlas.cmd` in the project folder. Choose Start app, Back up local data, Restore local data, or Check setup. The launcher finds this workspace's portable Node automatically, otherwise uses Node on PATH. It requires Node 24 or newer. It builds if the Worker config is absent, applies local migrations, then starts the development server; keep its terminal open and use Ctrl+C to stop it. After source/dependency changes, run `pnpm.cmd build` yourself before starting again.

The `.cmd` entry runs only its PowerShell process with `ExecutionPolicy Bypass`; it does not change your system execution policy. You can inspect `scripts/windows-launcher.ps1` before running it.

Stop **all** dev/preview servers before backup or restore, including any custom ports. The launcher requires you to type `STOPPED`; the helper additionally rejects listeners on ports 5173 and 8787. It cannot detect every custom-port server. Do not restart a server while the operation runs.

Backups are folders under `exports/local-backup-*` containing `backup.json` and the complete `.wrangler/state` tree (database, original files and emulator metadata). They are private, unencrypted, and excluded from source exports. Copy the whole folder to a safe location. They do not include source code, browser sign-in, browser model caches, dependencies, or hosted data. Use the same application/dependency versions when restoring; keep a source checkpoint alongside your data backup.

Restore checks every file's SHA-256 before replacing state. Existing state is preserved at `.wrangler/state.before-restore-*`, and the printed path identifies that rollback copy. No automatic deletion is performed. A failed operation may leave a staging/incomplete folder; a backup without a valid manifest must not be used.

Equivalent terminal commands, after stopping all servers:

```powershell
node scripts/local-backup.mjs backup exports/my-local-backup --stopped
node scripts/local-backup.mjs verify exports/my-local-backup
node scripts/local-backup.mjs restore exports/my-local-backup --stopped
```

The backup destination must not already exist. Restore replaces the current local library and notes with those in the backup, preserving the previous state separately. Restart the app and refresh the browser after restoring.

## Development sign-in URL

Visit this URL as a normal top-level navigation:

`http://localhost:5173/signin-with-chatgpt?return_to=/`

**Single-user trust boundary:** development sign-in provides no real multi-user security. It uses one convenience identity, not a password-protected account. Loopback does not isolate other local users/processes with access to the machine or emulator files. Use a trusted personal Windows session; this is not enterprise production-ready.

The portable development server creates a clearly local test identity (`Seedy`, `seedy@sites.test`), without a real ChatGPT login. This identity is development-only, guarded by loopback host/address checks, and excluded from the production build. If your server uses 127.0.0.1, use the same hostname consistently for sign-in and the app. Local mock sign-in does not exist in `pnpm start`'s built Worker preview; use `pnpm dev` for this flow.

Use fictional documents. Local uploads and notes are independent of the hosted Site. The browser downloads model weights from your local app only when you select meaning-based search. The initial model/runtime transfer is about 45 MB; inference and embedding caches run on-device.

## What is portable, and what still needs adaptation?

The source archive contains app code, test code, lockfile, migrations, synthetic fixtures, model assets/licenses, evaluation data and build helpers. It excludes dependency folders, local/hosted user data, secrets, Git metadata and runtime state. The existing Site's project ID is removed from the exported hosting manifest.

Local builds do not require the Sites plugin installation: the retained starter includes its build integration and Node scripts. The original hosted release uses Sites' private access boundary, trusted identity headers, D1 and R2. To deploy on another host you must configure equivalent authentication, user authorization and persistent storage. Do not publish the raw Worker to a public endpoint that accepts visitor-supplied identity headers. Changing a domain alone does not implement authentication.

The app UI may retain the portfolio author's branding; the local test identity is only for development access. Third-party notices/licenses must remain with redistributed assets. A project-wide public-source license should be selected by the author before publication.

## Source export

The original exported folder had no Git metadata; this working project now has local Git history. For a working-folder source snapshot: To package the current source with per-file SHA-256 hashes:

```powershell
pnpm.cmd export:checkpoint
```

This command uses an explicit source allowlist, verifies the ZIP payload hashes, excludes runtime data/secrets/dependencies/local tools, and strips the hosted project ID. The ZIP's `SOURCE-SNAPSHOT.json` identifies it as an uncommitted working-folder checkpoint. Its upstream commit records the original export's provenance, not a commit containing the current changes. This is not a backup of uploaded documents or saved notes.

After installing dependencies, `pnpm.cmd verify:checkpoint path-to-checkpoint.zip` verifies the archive's source payload hashes. Compare `Get-FileHash path-to-checkpoint.zip -Algorithm SHA256` with the delivered `.sha256` receipt as well. These hashes provide integrity checks, not a signed publisher identity.

From a clean, committed Git checkout:

```powershell
pnpm.cmd export:source
```

The ZIP is written to the ignored `exports` directory. It is a snapshot of committed tracked files, not private user uploads or local runtime state. Read `SOURCE-SNAPSHOT.json` for its source commit and export metadata. Commit reviewed code changes first; uncommitted work is deliberately not silently included.

## Browser checks

After installing dependencies, building and applying local migrations, run:

```powershell
pnpm.cmd test:browser
```

Playwright starts a dev server at `http://127.0.0.1:5173` or reuses one already running there. Browser tests sign in through the normal local development route. They default to headed Chromium with `slowMo: 800`, record videos, and pause for 10 seconds after each test. Follow [AGENTS.md](../AGENTS.md): announce the run first; if visible execution is unavailable, explain that before running headlessly and capture video or a trace.

This workspace has Chromium under `.tools/playwright`. On another checkout, install the free test browser once:

```powershell
pnpm.cmd exec playwright install chromium
```

To run one area, pass its spec, for example `pnpm.cmd test:browser semantic.spec.ts`. Recordings and failure screenshots are written under `outputs/playwright` unless `--output` selects another folder. A new run clears its output directory, so copy recordings you want to keep first. Tests leave clearly labelled synthetic uploads and review notes in local storage and refuse to overwrite different human notes at their reserved review dates.

## Verified status and limits

See [RELEASE_CHECKPOINT.md](RELEASE_CHECKPOINT.md) for the combined release check and [VERIFICATION_HISTORY.md](VERIFICATION_HISTORY.md) for the earlier Windows checkpoints. The original Linux export audit remains in [PORTABILITY_AUDIT.md](PORTABILITY_AUDIT.md).

This is a single-user local portfolio prototype with no paid services or cloud resources. Public deployment is deferred; [deployment blockers](DEPLOYMENT_SECURITY_REVIEW.md) remain open. A successful local run does not verify hosted authentication/account isolation, recovery beyond the [recorded local backup checks](LOCAL_TOOLS_VERIFICATION.md), alternative-host deployment, physical phones or every browser. Complete the [bounded local release checklist](LOCAL_RELEASE_CHECKLIST.md) before portfolio handoff. Independent held-out retrieval evaluation and immutable review history remain future work. No paid model service is required.

## Troubleshooting

- `401` in the local library: use the top-level development sign-in URL, with the same hostname as the app.
- Missing database table: run `pnpm build` followed by `pnpm local:db` before `pnpm dev`.
- Missing local model: restore the checked-in `public/models/minilm` assets. Normal builds do not fetch model weights from a provider.
- Dependency install blocked by an organizational registry/network policy: retain the lockfile and inspect that error; do not disable supply-chain checks blindly.
- Port 5173 is busy: stop the other local server, or run `pnpm dev --port 5174` and use that port consistently for sign-in.
- Do not upload `.env`, `.dev.vars`, `.wrangler`, `.sites-runtime` or private documents to GitHub.
