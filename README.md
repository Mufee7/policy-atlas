# Policy Atlas

Version-aware policy retrieval, source-quoted answers and evidence-linked review. An AI/ML engineering portfolio project by Mufeedh Ahmed.

Policy Atlas makes policy evidence inspectable: find the relevant edition, read its qualifications, and follow citations to the stored source. It is a local portfolio prototype, not a compliance authority or a production-security claim.

## Capabilities

- TXT, text-based PDF and DOCX ingestion with metadata, versions, provenance and original-file downloads.
- BM25 keyword and optional on-device MiniLM semantic retrieval, filtered by date, status and department.
- Bounded extractive answers with exact quotations, qualification context, verified citations and explicit refusal. No generated answers.
- Evidence-linked version comparison and rule-based potential-conflict review with saved human assessments.
- Owner-scoped document/review APIs, D1 metadata/text storage, R2 originals and local backup/restore tools.

[PROJECT_STATUS.md](PROJECT_STATUS.md) is the authoritative capability and verification inventory. [ROADMAP.md](ROADMAP.md) orders remaining work, led by independently authored evaluation and broader question coverage.

## Run locally on Windows

Follow [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) for Node/pnpm requirements, portable tools, installation, migrations and development sign-in. After installing dependencies, `Policy-Atlas.cmd` offers startup and local backup/restore commands.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd local:db
pnpm.cmd dev
```

Open the loopback URL printed by the server and use the development sign-in URL in the setup guide. Use fictional, non-sensitive documents. All additional services must remain free; the current retrieval, answering and evaluator need no paid model API.

## Try it

1. Ask `What is the remote work allowance?` with Approved only and date `2026-10-19`. Open the citations; check eligibility, written approval and exceptions alongside the allowance.
2. Ask `What is the remote work insurance allowance?`. Related passages do not establish that entitlement, so the answerer refuses.
3. Search `VPN device` and inspect the complete source passage. Compare Remote Work versions in the comparison view or inspect both sources in conflict review.

See [supported question forms](docs/ANSWERING_PROTOCOL.md) and [the Python evaluator guide/exercise](docs/ANSWERING_LEARNING.md).

## Evidence and limitations

The one-shot, internally reserved synthetic answering experiment produced **16/20 correct answerable cases and 0/20 unsupported answers**, with four false refusals. [Every result and failure](docs/ANSWERING_RESULTS.md) is retained alongside [raw inputs, labels, predictions and scores](evaluation/answering/final/). The same coding agent authored the fixtures and implementation, and the documents share templates; this is not independently authored evaluation or general reliability evidence. The consumed final set must not become a fresh benchmark after tuning.

Software and browser checks verify particular behaviors, not answer accuracy. Retrieval similarity does not prove support; copied text can still be irrelevant. Semantic retrieval uses pretrained ML inference, the answer selector uses deterministic rules, and conflict checks use narrow English patterns. No generative model or OCR is implemented. Metadata is manual, extraction can lose layout/context, and no policy authority is inferred.

Hosted authentication/account isolation, production recovery, broad document accuracy and alternative-host deployment remain unverified. Existing routes rely on a trusted identity-header boundary; do not expose the raw Worker publicly without equivalent authentication/authorization. See [current status](PROJECT_STATUS.md) and [deployment boundaries](docs/LOCAL_SETUP.md#what-is-portable-and-what-still-needs-adaptation).

## Repository and technical records

- [Repository/configuration audit](docs/REPOSITORY_AUDIT.md): tracked configuration, exclusions, required attribution and cleanup verification.
- [Implementation history](docs/IMPLEMENTATION_HISTORY.md), [Windows verification history](docs/VERIFICATION_HISTORY.md) and [Git checkpoints](docs/GIT_CHECKPOINT.md): original increment details and accurate development provenance.
- [Release checkpoint](docs/RELEASE_CHECKPOINT.md), [portability audit](docs/PORTABILITY_AUDIT.md) and [local backup verification](docs/LOCAL_TOOLS_VERIFICATION.md): checks tied to earlier snapshots, with their limits.
- Source packaging: `pnpm.cmd export:source` for a clean committed checkout; `pnpm.cmd export:checkpoint` for a working-folder snapshot. See [export instructions](docs/LOCAL_SETUP.md#source-export). Source ZIPs exclude private uploads/reviews and are not data backups.

## Development provenance and attribution

Developed by Mufeedh Ahmed with AI-assisted coding and review using OpenAI Codex, adapting an OpenAI Sites starter. Third-party model, parser, runtime and starter license notices are retained; [the repository audit](docs/REPOSITORY_AUDIT.md) lists them. A project-wide public-source license remains the author's decision before redistribution.
