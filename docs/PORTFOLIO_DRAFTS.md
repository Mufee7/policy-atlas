# Portfolio career drafts — for review

Based on verified single-user local release `c788ff1`. These drafts are unpublished. No model training, generative answering, enterprise deployment or measured business impact is claimed. The [README acknowledgment](../README.md#technical-records-and-attribution) retains development provenance.

## CV project entry

**Policy Atlas — Single-user local policy evidence application**

TypeScript/React · BM25 · pretrained MiniLM/Transformers.js · Python · SQL/Drizzle · Playwright

- Integrated BM25 keyword search and pretrained MiniLM/WASM semantic retrieval with date, approval-status and department filters for versioned policy documents.
- Implemented bounded, evidence-grounded extractive answers with exact quotations, source/version/location checks and explicit refusal; added rule-based potential-conflict review with evidence from both sources.
- Built an offline Python evaluator for correctness, citation integrity and refusal; the keyword-retrieval/extractive pipeline scored **16/20 correct answerable cases and 20/20 correct insufficient-evidence refusals** on an internally authored synthetic final set, with four false refusals.
- Diagnosed evidence-selection and browser-test synchronization failures; documented Windows reproduction steps and verified isolated backup restoration without replacing active library data.

Evaluation qualification: fixtures and implementation had the same coding-agent author and templated policies. Results are not independent or general reliability evidence, and do not establish semantic-mode answer accuracy. Retain this qualification with a metric-bearing portfolio excerpt; for a shorter CV, omit the numeric evaluation clause rather than presenting it as general accuracy. Select three bullets if space is limited.

## Evidence map and claim boundaries

| Claim | Recorded evidence | Boundary |
|---|---|---|
| Retrieval | [Semantic worker](../public/semantic/worker.mjs), [retrieval helpers](../lib/retrieval.ts), [architecture](ARCHITECTURE.md) | Pretrained inference, not model training. Retrieval relevance is not answer support. |
| Grounded extraction and rule-based review | [Answer selector](../lib/answering.ts), [conflict rules](../lib/conflicts.ts), [release rehearsal](LOCAL_RELEASE_CHECKLIST.md) | Deterministic extraction and four narrow constraint families; no generated synthesis or policy-authority decision. |
| Python evaluation and results | [Results/all failures](ANSWERING_RESULTS.md), [raw report](../evaluation/answering/final/report.json), [Python learning guide](ANSWERING_LEARNING.md) | Keyword retrieval plus extractive selection. Internally authored synthetic 40-case final set; same coding-agent author, template overlap, four false refusals; final set consumed. |
| Debugging | [Development failure analysis](ANSWERING_RESULTS.md#development-and-software-verification), [release test corrections](LOCAL_RELEASE_CHECKLIST.md#release-decision-and-final-browser-results) | Development evidence-selection errors were corrected before freeze. Later selector/cold-start fixes were test-harness corrections, not application comparison fixes. No tuning against final failures. |
| Reproducibility and recovery | [Windows setup](LOCAL_SETUP.md), [release record](LOCAL_RELEASE_CHECKLIST.md), [configuration migration](LOCAL_CONFIG_MIGRATION.md) | 101 Node tests, seven Python unit tests and typecheck/build at `c788ff1`; 26 distinct functional browser scenarios across corrected runs at `b806210`, plus the restored-app check of 11 documents/originals and 10 notes. The configuration migration rechecked data through isolated HTTP and verified both export formats; it did not rerun the full browser suite. Installed Windows environment and matching-version restore; fresh-machine/full reinstall remains unverified. |

Do not substitute “80% accurate AI”, “hallucination-free RAG”, “trained a language model”, production deployment, FastAPI experience or business-impact estimates for these bounded claims. Tests and citation existence alone do not prove answer accuracy. Source-file fidelity was sampled, not server-enforced.

## LinkedIn announcement draft

I’ve completed a verified **single-user local release of Policy Atlas**, a portfolio project focused on inspectable policy evidence across document versions.

It combines BM25 and **pretrained MiniLM semantic retrieval** with **bounded extractive answering**: exact source quotations, version/location references and explicit refusal. Separate rules support potential-conflict review with evidence from both sources. There is no generative answering model or project-specific model training.

I built an offline Python evaluator and investigated evidence-selection and browser-test failures. The keyword-retrieval/extractive pipeline achieved **16/20 correct answerable cases and 20/20 correct insufficient-evidence refusals** on an internally authored synthetic final set. Four answerable paraphrases were falsely refused. The same coding agent authored fixtures and implementation, and documents share templates: these are limited sample results, not independent reliability evidence or semantic-mode accuracy results.

The release includes documented Windows setup, citation and persistence checks, and isolated backup restoration without replacing active data. It requires no paid model APIs or cloud resources; it is not publicly deployed or enterprise production-ready.

I’m preparing a short recorded demo. I’d welcome feedback on retrieval evaluation, evidence sufficiency and reproducible ML engineering.

#AIEngineering #MachineLearning #InformationRetrieval #Portfolio

## Before committing or sharing

Keep these drafts for author review; the demo script is not a finished video. Retain the README acknowledgment, licenses, evaluation limitations and failure evidence. Use only inspected synthetic screenshots or a reviewed recording. Add repository/demo links only when real and approved. No publishing, pushing or upload is authorized by this document.
