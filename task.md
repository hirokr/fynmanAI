# Hackathon MVP Server Tasks

This project is an MVP for a hackathon. Do not try to complete every unfinished server feature before the demo. The goal is one polished path:

User uploads or creates a learning resource -> starts a session -> explains a topic -> receives probing questions -> ends the session -> receives a final evaluation.

## MVP Must Complete

These are the only server items that can block a successful demo.

### P0 - Make Audio Results Reliably Reach The Client

**Feature:** Real-time audio transcription and probing-question delivery.

**What is unfinished or buggy:**
- When audio processing uses the BullMQ queue, the socket waits only for a limited timeout.
- If the worker finishes later, the worker logs completion but the client may not receive `transcript_update` or `probing_question`.
- This can make the live demo look broken even if transcription succeeded.

**MVP completion approach:**
- For the hackathon demo, prefer the simplest stable path: set `ENABLE_AUDIO_PROCESSING_QUEUE=false` and process audio inline.
- Keep the queue path as post-MVP unless inline processing is too slow.
- Verify that one audio chunk produces a transcript update and, after the configured interval, a probing question.

**Done when:**
- The demo flow consistently shows transcript updates in the frontend.
- The frontend receives probing questions during a session.
- No transcript result disappears silently.

### P0 - Prevent Bad LLM Output From Breaking The Frontend

**Feature:** Rolling feedback and final mastery evaluation.

**What is unfinished or buggy:**
- The server asks the LLM for JSON but only extracts a JSON-looking block from plain text.
- If the LLM returns malformed or incomplete JSON, the frontend can receive inconsistent evaluation data.

**MVP completion approach:**
- Add a lightweight fallback, not a full structured-output system.
- If rolling feedback JSON parsing fails, return:
  - `questions: [raw response or generic probing question]`
  - empty `clarifications`
  - empty `detected_gaps`
  - `topic_drift: false`
- If final evaluation JSON parsing fails, return:
  - a short summary from the raw response
  - empty arrays for list fields
  - a safe confidence score
- Keep full Zod validation and retry/repair for post-MVP.

**Done when:**
- Rolling feedback always returns a frontend-safe shape.
- Final evaluation always returns a frontend-safe shape.
- A malformed LLM response does not crash or block the demo.

### P0 - Make One Resource Ingestion Path Work End-To-End

**Feature:** Learning resource ingestion, chunking, embedding, and retrieval.

**What is unfinished or buggy:**
- Text resources and file uploads use different flows.
- `POST /resources` works cleanly for `TEXT`.
- File parsing exists through `POST /document-parser/parse`, but the flow is less obvious.
- A hackathon MVP does not need every upload path; it needs one reliable path.

**MVP completion approach:**
- Pick one canonical demo path:
  - Preferred fastest path: use `TEXT` resources through `POST /resources`.
  - If file upload is required for the demo: use `POST /document-parser/parse` as the canonical file path.
- Document the chosen path for the frontend team.
- Ensure the resource reaches `READY`, has chunks, embeddings, and can be retrieved during evaluation.

**Done when:**
- A demo resource can be created from the frontend.
- The resource becomes `READY`.
- Starting a session with that resource succeeds.
- Feedback/final evaluation can retrieve context from that resource.

### P1 - Add A Minimal Demo Flow Test Or Manual Script

**Feature:** Confidence that the core story works before presenting.

**What is unfinished or buggy:**
- Existing tests do not cover the full product path.
- Without a simple test or script, regressions may show up during the demo.

**MVP completion approach:**
- Add either one automated integration test or one documented manual smoke script.
- Cover the happy path only:
  - create/login user if needed
  - create text resource
  - start session
  - append transcript or send one audio chunk
  - request feedback
  - end session
  - fetch report
- Mock external providers if writing an automated test is faster than calling real APIs.

**Done when:**
- The team can run one repeatable check before the demo.
- The check proves the core MVP path works.

### P1 - Document The Demo API Contract

**Feature:** Frontend/server integration.

**What is unfinished or buggy:**
- The README is short.
- `server/todo.md` says many things are implemented, but that is too broad for MVP planning.
- The frontend team needs to know exactly which endpoints and socket events to use.

**MVP completion approach:**
- Add a small MVP section to `server/README.MD` or keep this in a shared team note.
- Document:
  - chosen resource creation path
  - session start payload
  - transcript/audio event payload
  - feedback response shape
  - final report response shape
  - required env vars for demo

**Done when:**
- A teammate can run the MVP flow without reading server internals.

## MVP Nice To Have

Only do these if the must-complete items are stable.

### P2 - Basic Session Guardrails

**Feature:** Session lifecycle safety.

**What is unfinished or buggy:**
- The socket flow should not accept audio for ended sessions.
- Inactive session timeout behavior is not important for the demo, but ended-session behavior is visible.

**MVP completion approach:**
- Reject audio chunks when the session status is `ENDED`.
- Return a clear client error.

### P2 - Simple File Upload Polish

**Feature:** Uploaded document resources.

**What is unfinished or buggy:**
- Direct upload storage is not fully wired to object storage.
- For a demo, durable S3 storage is not required if local/temp parsing works.

**MVP completion approach:**
- Use local parsing for demo.
- Show upload status clearly.
- Skip S3 unless the deployment environment needs it.

