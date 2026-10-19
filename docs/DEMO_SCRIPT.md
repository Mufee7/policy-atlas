# Policy Atlas demo script — 3 minutes 50 seconds

Draft for recording/review, not a finished video. Demonstrates existing local release `c788ff1`; no features, cloud resources or final answering evaluation are needed. [Setup](LOCAL_SETUP.md), [architecture](ARCHITECTURE.md) and [release evidence](LOCAL_RELEASE_CHECKLIST.md) supply details rather than repeating them here.

## Before recording

- Use a separate synthetic demo copy/library, following the isolated environment approach in the release checklist. Keep the active library intact. Start on loopback and sign in through the documented development route. Never delete active state to obtain a clean take.
- Confirm `public/samples/travel-policy.pdf` is absent from the demo library. Exact-byte duplicate detection can reject it even under a new ID; do not bypass that protection or pretend a reused file was newly saved.
- Have the PDF and metadata below ready to paste. Open the original PDF to page 2 in a second window. Use 1440×1000 or similar desktop size; hide unrelated windows/notifications and inspect the take for private content before sharing.
- Verify the selected remote-work pair/date has no existing review to overwrite. Use a clean synthetic environment or another unused review date if necessary. Say which date you use.
- Keep keyword mode for the timed answer/refusal. Optional semantic inference is described in narration, not silently substituted for the demonstrated answer mechanism. Do not import reserved final inputs or rerun the final evaluator.

## Timed recording plan

| Time | Actions and exact inputs | Suggested narration |
|---|---|---|
| 0:00–0:20 | Show app and loopback URL. | “Policy Atlas is my single-user local portfolio application for finding policy evidence across versions. It runs locally without paid model APIs. This is a synthetic demonstration, not company guidance or an enterprise deployment.” |
| 0:20–1:05 | **Upload document** → select `public/samples/travel-policy.pdf`. Title `Fictional Travel Policy — Demo`; ID `DEMO-TRAVEL-001`; version `1.0`; department `Training`; status `Approved`; effective from `2026-01-01`; no end date; mark fictional. **Read document** → **Inspect extracted text**. Show page 2; compare the LKR 3,500 sentence and receipts/alcohol condition to the original. Acknowledge limitations; **Save document**. | “I supply metadata and review extraction before saving. Page references link to extracted PDF pages. This sample matches its original, but the server does not independently guarantee extraction fidelity. Image-only pages need OCR outside this app.” |
| 1:05–1:50 | **Evidence search**: keyword mode, date `2026-10-19`, Approved only, department `People`. Ask `What is the remote work allowance?` → **Find evidence**. Open `POL-001 / v2.0` direct-evidence citation, inspect source, then close it. | “Now I’m using the bundled synthetic Remote Work Policy, not the uploaded travel file. The current edition permits up to three days, with written manager approval. The answer also retains eligibility, exclusions and exception conditions. This is exact source extraction with deterministic support checks, not generated prose.” |
| 1:50–2:10 | Ask `What is the remote work insurance allowance?`. Show refusal and available search evidence. | “Related vocabulary does not establish an insurance allowance. The system refuses because its evidence rules do not support the requested fact. Refusal is separate from a storage or model failure.” |
| 2:10–2:45 | **Version comparison** → family `POL-001`; Before v1.0, After v2.0. Show two-to-three-day change and written-approval change; open one source, close, then swap direction to show reverse-chronology notice. | “These are literal edits between explicitly selected editions. I can inspect each version and reverse the comparison. A text change is not a legal interpretation or authority decision.” |
| 2:45–3:25 | **Conflict review** → Document A Remote Work v1.0, B v2.0; Review as of `2026-10-19`. Open each finding citation briefly. Assessment **Historical change**. Paste note below; **Save review**. Refresh; reopen pair/date and show saved note. | “Conflict review uses narrow rules and evidence from both sources. These sequential editions are a historical change, not proof of simultaneous contradictory policy. I save a human assessment; refresh shows local persistence. This is editable review, not immutable audit history.” |
| 3:25–3:50 | Show evaluation table in README; finish on architecture link. | “With keyword retrieval and extractive selection, our internally authored synthetic evaluation scored 16/20 answerable and 20/20 refusals. Four answerable paraphrases were missed. Fixtures and implementation had the same coding-agent author, so these are not independent reliability results. MiniLM is pretrained retrieval; answering and conflict review use rules. This is a single-user local release.” |

Review note to paste:

> PORTFOLIO-DEMO — Inspected POL-001 v1.0 and v2.0. Remote-work allowance changes from two to three days per week; v2.0 requires written manager approval. Sequential editions: historical change. No policy authority decision.

The schedule totals **230 seconds**. Paste metadata to keep the pace, but leave visible time for citations. Do not speed through a failure: retain or narrate it, then retry transparently. If cold startup or upload needs longer, pause before the timed take rather than editing away an unsuccessful save and implying continuous success. A shorter cut may omit the direction swap, not qualifications or the evaluation caveat.

## Optional discussion after the timed demo

Use `Whose permission is needed for remote work?` to demonstrate a known answerable-paraphrase false refusal while approval evidence remains inspectable. This is the release rehearsal's bundled-policy illustration, not a replay of final reserved cases. Do not change grammar rules to improve the recording. For semantic retrieval, explain local MiniLM/WASM and keyword fallback using [the walkthrough](ARCHITECTURE.md), without attributing semantic-mode accuracy to the extractive evaluation.

## Guided rehearsal environment

For guided practice, use the separate ignored source copy `work/portfolio-rehearsal-c788ff1/app`, with its own newly migrated emulator state and port **5174**. Open `http://127.0.0.1:5174/signin-with-chatgpt?return_to=/` once it is started. This port is specific to the rehearsal; the normal app default remains 5173. Never copy demo state over the active `.wrangler/state`.

Begin with only bundled synthetic policies and no uploaded documents/review notes. The PDF upload above then becomes genuinely new rather than a duplicate. Questions and comparison use bundled `POL-001` v1.0/v2.0; the upload uses the separate travel PDF. Confirm upload and note-save success before narrating them as successful. A running rehearsal or draft script is not a finished recorded video.
