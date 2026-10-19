# Policy Atlas repository and configuration audit

Date: 2026-10-19. Starting checkpoint: `1803f72`, clean `main` working tree. This cleanup changes presentation, documentation and source-export exclusions; it does not change product features, answering rules, retrieval, storage identity, deployment or Git history.

## Presentation and documentation

- README now introduces Policy Atlas directly, links the authoritative status/roadmap and separates software checks from answering measurements. The long verification and increment sections were moved to [IMPLEMENTATION_HISTORY.md](IMPLEMENTATION_HISTORY.md); original measurements and historical limitations remain available.
- The logo/workspace, page metadata, About copy and footer use consistent Policy Atlas wording. Removed the inflated “Enterprise … Intelligence Assistant” description, obsolete “R1 / retrieval baseline” labels, and stale copy that treated quoted answers as future work. Generic “private Site” wording became application/storage wording.
- The README's single **Development provenance and attribution** section acknowledges AI-assisted development and the starter origin. Technical identifiers, license notices and facts about evaluation authorship remain where needed; they are not marketing acknowledgments. No claim of unaided authorship was introduced.
- Author credit, synthetic-data notices, no-generation/OCR limits, similarity-versus-support warnings, independent-evaluation gaps and security/deployment boundaries are retained. The original frozen evaluation was not rerun or relabelled.

Subsequent configuration-only migration: [local-bindings.json](../local-bindings.json) now replaces the old manifest and obsolete Sites packaging hook. The findings below describe the earlier cleanup checkpoint; [the migration record](LOCAL_CONFIG_MIGRATION.md) documents the current contract.

## `.openai` and functional integration references

The only tracked `.openai` file is `.openai/hosting.json`. Inspection found exactly `{"d1":"DB","r2":"BUCKET"}`: binding names, no service key or hosted project ID. Its path is part of the retained starter's configuration contract.

| Reference | Why retained |
|---|---|
| `vite.config.ts` imports `.openai/hosting.json` | Supplies D1/R2 bindings to the local Worker configuration. |
| `build/sites-vite-plugin.ts` | Implements local development identity and copies the manifest to `dist/.openai/hosting.json` at build time. Its upstream license/comment remains. |
| `build/sites-worker.ts` and connector preview files | Worker entry and referenced development/runtime integration. Removing names/files would alter the build. |
| `db/index.ts`, `scripts/local-db.mjs` | Expect the DB binding and produce local migration configuration. |
| `scripts/sites-env.*`, execution-profile/build helpers | Portable/managed build and project-local tool paths; not UI branding. |
| `app/chatgpt-auth.ts`, identity header names and development sign-in route | Retained authentication integration helpers/contracts. Local mock identity is not production authentication. |
| Source exporters | Retain the binding manifest while stripping `project_id` from exported hosting identity. |

Stable `site-creator-d1` / `site-creator-r2` emulator identifiers and the local test owner identity were not renamed: they identify existing local state, not just a display brand. No credentials, remote configuration or identity/access behavior were changed. Other `.openai` contents remain ignored and excluded from exports.

## Git and source-package exclusions

The initial tracked-path/content inspection covered 237 files: no private/runtime paths or common credential-shaped content were found. This is a bounded scan, not a security certification. No tracked private data required removal, and no local uploads, backups or runtime files were deleted.

| Category | Excluded examples |
|---|---|
| Credentials/configuration state | `.env*` except `.env.example`, `.dev.vars*`, `.aws`, `.ssh`, non-manifest `.openai` contents, PEM/key/PFX/P12 files |
| User/private data | `uploads/`, `backups/`, `private/`, local databases and archives |
| Emulator/tool state | `.wrangler/`, `.sites-runtime/`, `.tools/`, `.agents/`, `.codex/`, `work/` including reserved-set staging |
| Generated output | `dist/`, `.next/`, `.vinext/`, `.test-build/`, TypeScript build info, Python caches, `outputs/`, `exports/`, Playwright reports/results, coverage |
| Dependencies | `node_modules/` at any depth |

Git ignore rules now cover nested dependency directories, common test reports and local database/archive artifacts. Both source exporters use the strengthened shared filter, including working data, credential directories, Python caches and non-manifest `.openai` files. The working-folder export allowlist now includes `PROJECT_STATUS.md`, `ROADMAP.md` and the published `evaluation/` evidence, while reserved private staging remains excluded. Exclusion tests check these distinctions.

Intentional tracked generated/derived artifacts are retained: migration SQL/snapshots, public parser/runtime bundles with licenses, pinned model/tokenizer assets, fictional ingestion fixtures, source provenance manifests and published evaluation inputs/labels/predictions/reports. They are necessary runtime assets, schema history or reproducibility evidence—not disposable build output. Consumed fictional final labels are public audit evidence; future reserved labels belong outside application imports and normal exports.

## Licenses and evaluation provenance

Retained unchanged: `build/sites-vite-plugin.LICENSE`, `vendor/shadcn-tailwind-4.13.0.LICENSE.md`, `public/parsers/PDFJS-LICENSE`, `public/semantic/vendor/TRANSFORMERS-LICENSE`, and `public/models/minilm/LICENSE`, model README and provenance metadata. Existing in-file notices remain. A project-wide redistribution license has not been invented or inferred from vendor licenses.

The answer algorithm, core retrieval and Python scorer remain byte-identical to their frozen evaluation versions. Presentation and repository tooling files have changed since that freeze, so the complete old source-hash manifest is a historical checkpoint, not a claim that every current file is unchanged. The original 16/20 and 0/20 result remains tied to `5b6c60f`; no new independent or final-evaluation claim is made.

## Verification

100 software tests, seven Python evaluator tests, TypeScript checking and production build passed. The build still consumes the original binding manifest. Three focused headed browser checks passed: the extractive answer/citation/export/refusal flow and navigation/About/layout at 320px and 375px desktop viewports. Runs used `slowMo: 800`, videos and ten-second inspection pauses. Physical phones, the full browser suite and hosted deployment were not tested for this text/tooling cleanup. Logs/artifacts are under ignored `outputs/repository-cleanup/`.

Source-package verification uses the actual allowlisted working tree, round-trips the ZIP payload hashes, checks required binding/license/evaluation/planning files and rejects private/generated paths. The resulting archive is an ignored packaging smoke-test artifact, not a deployed release or private-data backup. Original frozen evaluation data, vendor notices and archived README increment text are checked against their prior content; documentation link targets are checked locally.
