# Policy Atlas roadmap

Release target: a strong **single-user local Windows portfolio release**, with AI/ML learning alongside implementation. No paid services, cloud resources, public deployment or authentication project is required for this release. Preserve the working app and commit `4b0a43d` as the preceding checkpoint; no history rewrite. [PROJECT_STATUS.md](PROJECT_STATUS.md) remains the capability inventory.

## 1. Completed milestone: bounded local release verification

The [local release checklist](docs/LOCAL_RELEASE_CHECKLIST.md) is complete for the installed Windows environment: 26 distinct functional browser scenarios plus the isolated restored-app check passed, with test-harness failures and remaining limits recorded. The active library stayed unchanged. Reuse these gates after relevant changes, using fictional documents and an isolated restore destination. Close failures within existing behavior rather than adding features for breadth. Explicitly unsupported layouts or question types may remain limitations; inaccurate source references, lost notes, unusable recovery or unclear failure states may not be hidden behind passing software tests.

Acceptance: default app listeners are loopback-only; one supported TXT/PDF/DOCX fixture each has inspected original-to-extraction fidelity; an answer, a refusal and a known false refusal are demonstrated honestly; comparison and both-source conflict review/save/refresh work; malformed/oversized uploads fail clearly; a stopped-server backup restores original bytes and review notes in isolation. Record commands, versions, actual results and unresolved limitations. Current historical evidence is linked in the checklist, not silently promoted to a new release run.

Development sign-in is a convenience identity for one local operator, **not real multi-user security**. Other local processes/users with access to this session or state are outside the isolation claim. Do not use LAN binding, tunnels or port forwarding. The app is not enterprise production-ready. [Setup and trust boundary](docs/LOCAL_SETUP.md), [preserved deployment blockers](docs/DEPLOYMENT_SECURITY_REVIEW.md).

## 2. Grounded-answer quality and honest evaluation

The bounded extractive milestone is implemented. Preserve the [protocol](docs/ANSWERING_PROTOCOL.md), [all results/failures](docs/ANSWERING_RESULTS.md) and [Python learning exercise](docs/ANSWERING_LEARNING.md). Frozen implementation `5b6c60f` achieved 16/20 correct answerable, 0/20 unsupported and 20/20 correct refusals, with 96/96 valid citations on the once-run internally reserved final set. Four answerable paraphrases were falsely refused. This set is consumed; do not rerun it as a fresh benchmark or tune silently against it.

Independent evaluation remains an original quality gap, not a requirement to invent a larger feature set before the local release. If a separate reviewer is available, use permission-cleared/fictional documents, group versions and near-duplicates into one split, record authorship/access, and reserve fresh labels outside implementer feedback. Freeze rubric/code before a final run and report every failure. Keep initial sample targets (at least 16/20 answerable, zero unsupported across 20 insufficient cases, complete citation integrity) explicitly sample-level. If no independent reviewer is available, retain the internal label and current limits rather than claiming independence.

Any later question-language improvement uses new development cases and a new final set. Grounded answering and evidence quality take priority over convenience additions. Software tests, retrieval Recall@k/MRR and quotation existence are distinct from semantic answer correctness.

<a id="next-milestone"></a>

## 3. Portfolio documentation and next quality milestone

The public repository includes the README, architecture, setup, tests, curated screenshots and evaluation evidence. Personal presentation scripts, CV drafts and transfer manifests are kept outside the published source. The next quality milestone is the independently authored evaluation described above; public deployment remains deferred.

Portfolio maintenance checklist:

1. Refresh the [README](README.md) around the verified local quick start, supported use cases, measured results and limitations; link existing operating/evaluation guides.
2. Prepare one architecture walkthrough showing browser ingestion/extraction, BM25 and pretrained MiniLM retrieval, deterministic extractive selection/refusal, TypeScript APIs, emulated D1/R2 and local backup boundaries. Distinguish exact stored-text verification from original-file fidelity, rule-based conflicts from ML, and extractive output from generation.
3. Record a short local demo with fictional data: upload/source, version/filter selection, correct answer plus citations, insufficient-evidence refusal, known false refusal, both-source conflict evidence and saved-note refresh. Explain the four failures and consumed evaluation honestly. Inspect the recording for private paths/data before sharing.
4. Package reproducible source/setup instructions, results/error analysis and a concise learning narrative for the portfolio/resume. Retain attribution, development history and third-party licenses; resolve the author's project-license choice before public redistribution. No hosting or cloud account is needed to prepare these artifacts.

## 4. Deferred original requirements, not local release gates

- **Public/shared deployment and authentication:** blocked by unverified identity headers, host bypass prevention and multi-account isolation. Preserve the full [security review](docs/DEPLOYMENT_SECURITY_REVIEW.md). No cloud resources, host selection or auth implementation now.
- **Generated answering:** absent; retain extractive mode. Consider local inference only if a concrete use case justifies it after evidence/evaluation work. No paid model or provider key.
- **Python/FastAPI:** the offline Python evaluator is real learning evidence; FastAPI/Pydantic/OpenAPI remain missing. A later narrow adapter needs a useful contract and tests, not a rewrite for technology breadth.
- **Broader ingestion/conflict quality:** original-layout fidelity and independent conflict precision/recall remain bounded/unverified. No OCR, broad contradiction model, semantic/legal authority inference or immutable review history is claimed. Extend only in response to observed needs.
- **Recovery at scale:** distributed D1/R2 transactions, power-loss guarantees, cross-version restore and hosted recovery remain outside this local release.

[Verification history](docs/VERIFICATION_HISTORY.md), [portability audit](docs/PORTABILITY_AUDIT.md), [repository audit](docs/REPOSITORY_AUDIT.md) retain earlier work. This roadmap supersedes the former deployment-oriented ordering; it does not erase missing original requirements or evaluation limitations.
