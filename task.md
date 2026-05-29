# Backend Missing Features Task List

## P0 - Product Flow Blockers

- [x] Create this prioritized backend task list.
- [x] Add resource management APIs: list, update, delete, retry ingestion, and ingestion status.
- [x] Validate resource ownership and readiness before attaching resources to a session.
- [x] Add session history APIs: list sessions and fetch session detail with transcript, resources, rolling evaluations, and final report.
- [x] Standardize realtime event names and payloads against the documented contract.

## P1 - Evaluation Quality

- [x] Return structured realtime probing output instead of raw LLM prose.
- [x] Add retrieval citations: chunk id, resource id, resource title, score, and source metadata.
- [x] Include citations in rolling feedback and final evaluation metadata.
- [x] Add domain-specific rubrics for math and physics.

## P2 - Reliability And Operations

- [x] Add combined health checks for database, Redis, Qdrant, queues, STT, parser, and LLM providers.
- [x] Move expensive STT/retrieval/LLM operations toward background workers where useful.
- [x] Harden audio ingestion with chunk duration validation, ordering, silence handling, and retry behavior.
- [x] Add ingestion observability for queued, active, completed, and failed jobs.

## P3 - Security And Scale

- [ ] Add rate limits for REST endpoints and per-session websocket usage.
- [ ] Add configurable retention policies for transcripts, uploaded resources, and analytics.

## P4 - Analytics Product APIs

- [ ] Add session analytics endpoints.
- [ ] Add user progress endpoints across sessions.
- [ ] Add concept coverage and topic drift trend endpoints.
- [ ] Add export/report endpoints for final evaluations.
