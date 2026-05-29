**Legend**

- [x] Implemented
- [ ] Partial
- [ ] Missing
- [ ] N/A (frontend/product)
- [ ] Deferred (not required for MVP)

**Project Vision**

- [x] Implemented — listens to the user in real time
- [x] Implemented — transcribes speech continuously
- [x] Implemented — retrieves relevant knowledge from uploaded resources
- [x] Implemented — asks deep follow-up questions
- [x] Implemented — identifies weak understanding (via final evaluation: weaknesses, missed_concepts)
- [x] Implemented — generates a final mastery evaluation
- [x] Implemented — evaluate understanding
- [x] Implemented — probe reasoning
- [x] Implemented — identify conceptual gaps (via evaluation.weaknesses + missed_concepts)
- [x] Implemented — force deeper explanations

**Core Philosophy**

- [ ] N/A (product principle) — fast answers
- [ ] N/A (product principle) — summaries
- [ ] N/A (product principle) — convenience
- [ ] N/A (product principle) — active recall
- [ ] N/A (product principle) — conceptual articulation
- [ ] N/A (product principle) — reasoning depth
- [ ] N/A (product principle) — teaching-based learning

**Primary MVP Goal**

- [x] Implemented — accepts uploaded learning resources
- [x] Implemented — processes and embeds them
- [x] Implemented — listens to user explanations in real time
- [x] Implemented — asks targeted follow-up questions
- [x] Implemented — evaluates understanding quality

**Scope Constraints**

- [x] Implemented — domain-constrained; unsupported subjects throw 400 (domain.service.ts)
- [ ] N/A (product constraint) — general-purpose tutoring blocked by domain enforcement
- [ ] N/A (product constraint) — open-ended chatting blocked by system prompt constraints
- [x] Implemented — math/physics default subjects via DOMAIN_ALLOWED_SUBJECTS env var

**System Design (User)**

- [ ] N/A (user action) — uploads resources
- [ ] N/A (user action) — selects topic
- [ ] N/A (user action) — explains verbally
- [x] Implemented — receives evaluation (GET /sessions/:id/report + session:summary socket event)

**System Design (Frontend)**

- [ ] N/A (frontend) — audio capture
- [ ] N/A (frontend) — websocket streaming
- [ ] N/A (frontend) — live transcript display
- [ ] N/A (frontend) — feedback UI
- [ ] N/A (frontend) — session dashboard

**System Design (Backend)**

- [x] Implemented — websocket server (socket.io, realtime.socket.ts)
- [x] Implemented — session manager (session.service.ts + session-cache.service.ts)
- [x] Implemented — transcription pipeline (stt.service.ts, Whisper API)
- [x] Implemented — embedding pipeline (ai.service.ts, resource-ingest.service.ts)
- [x] Implemented — vector retrieval (qdrant.service.ts, retrieval.service.ts)
- [x] Implemented — llm orchestrator (ai.service.ts with provider fallback)
- [x] Implemented — evaluation engine (evaluation.service.ts, ROLLING + FINAL)
- [x] Implemented — analytics (analytics.service.ts; events: session.created, session.ended, evaluation.rolling, evaluation.final, resource.ingestion.started/completed/failed)

**System Design (Infrastructure)**

- [x] Implemented — Redis (transcript cache, session metadata, analysis rate-limiting)
- [x] Implemented — Vector DB (Qdrant)
- [x] Implemented — Object Storage (S3 optional, controlled by S3_BUCKET env)
- [x] Implemented — LLM APIs (OpenRouter/Groq/OpenAI with fallback)

**Core Data Flow Step 1 — Resource Upload**

- [x] Implemented — PDF (document-parser.controller.ts → document-parser.service.ts)
- [x] Implemented — image (via document parser pipeline)
- [x] Implemented — notes / text (TEXT sourceType via resource.controller.ts)
- [x] Implemented — text files (via document parser)
- [x] Implemented — detects file type
- [x] Implemented — extracts text
- [x] Implemented — cleans text (cleanResourceText in resource-ingest.service.ts)
- [x] Implemented — chunks content (chunkText; 300–800 tokens, 10–20% overlap via env)
- [x] Implemented — generates embeddings
- [x] Implemented — stores embeddings in vector DB (Qdrant)

**Core Data Flow Step 2 — Topic Initialization**

- [x] Implemented — subject (persisted in Session, validated by domain.service.ts)
- [x] Implemented — topic (persisted in Session)
- [x] Implemented — learning goal (persisted in Session)
- [x] Implemented — semantic anchor (subject/topic passed to retrieval filter)
- [x] Implemented — retrieval filter (buildResourceFilter in qdrant.service.ts)
- [x] Implemented — evaluation scope (subject/topic injected into LLM prompts)

**Core Data Flow Step 3 — Real-Time Speaking Session**

- [ ] N/A (frontend) — captures microphone audio
- [ ] N/A (frontend) — chunks audio every 2–5 seconds
- [ ] N/A (frontend) — streams chunks via WebSocket
- [x] Implemented — buffers audio (base64 decode in realtime.socket.ts)
- [x] Implemented — runs speech-to-text continuously (Whisper API)
- [x] Implemented — appends transcript to rolling memory (Redis + DB)

**Core Data Flow Step 4 — Rolling Analysis**

- [x] Implemented — recent transcript is normalized (transcript-preprocess.service.ts)
- [x] Implemented — transcript is embedded
- [x] Implemented — vector search retrieves relevant chunks
- [x] Implemented — LLM receives recent transcript
- [x] Implemented — LLM receives retrieved context
- [x] Implemented — LLM receives evaluation instructions (system prompt in buildRealtimeMessages)
- [x] Implemented — probing questions (analysis:question socket event)
- [x] Implemented — clarification requests (included in LLM prompt output)
- [x] Implemented — gap detection (included in LLM prompt output)

**Core Data Flow Step 5 — Final Evaluation**

- [x] Implemented — full transcript assembled (getSessionTranscriptText)
- [x] Implemented — understanding analysis generated (generateFinalEvaluation)
- [x] Implemented — conceptual gaps identified (missed_concepts field)
- [x] Implemented — confidence score computed and clamped [0–100]
- [x] Implemented — final report returned (GET /sessions/:id/report + session:summary event)

**User Flow — Upload Phase**

- [x] Implemented — creates session (POST /api/sessions)
- [x] Implemented — uploads learning resources (POST /api/parser/parse for files)
- [x] Implemented — selects topic (subject/topic in session creation payload)
- [x] Implemented — starts session (socket session:start event)

**User Flow — Learning Phase**

- [ ] N/A (user action) — explains concepts verbally
- [ ] N/A (user action) — continues speaking naturally
- [x] Implemented — receives periodic probing questions (analysis:question socket event)
- [ ] N/A (user action) — clarifies weak explanations

**User Flow — Evaluation Phase**

- [x] Implemented — understanding summary (Evaluation.summary)
- [x] Implemented — weak areas (Evaluation.weaknesses)
- [x] Implemented — missed concepts (Evaluation.missedConcepts)
- [x] Implemented — follow-up recommendations (Evaluation.followUp)
- [x] Implemented — conceptual confidence score (Evaluation.confidenceScore, clamped 0–100)

**Technical Architecture — Frontend Stack**

- [ ] N/A (frontend) — Next.js
- [ ] N/A (frontend) — React
- [ ] N/A (frontend) — Tailwind
- [ ] N/A (frontend) — WebSocket client

**Technical Architecture — Backend Stack**

- [x] Implemented — Node.js
- [x] Implemented — Express
- [x] Implemented — Socket.IO (WebSocket library)

**Technical Architecture — Backend Responsibilities**

- [x] Implemented — session orchestration
- [x] Implemented — websocket handling
- [x] Implemented — authentication (JWT + refresh token rotation)
- [x] Implemented — transcript processing
- [x] Implemented — LLM coordination
- [x] Implemented — vector retrieval
- [x] Implemented — analytics

**STT Options**

- [x] Implemented — Whisper API (stt.service.ts; provider selectable via STT_PROVIDER env)
- [ ] Deferred — Faster-Whisper (not required for MVP)
- [ ] Deferred — Deepgram (not required for MVP)
- [ ] Deferred — AssemblyAI (not required for MVP)

**Chunking Strategy**

- [x] Implemented — 300–800 tokens (RESOURCE_CHUNK_TOKENS env, default 600)
- [x] Implemented — overlap: 10–20% (RESOURCE_CHUNK_OVERLAP env, default 80 tokens)

**Embedding Models**

- [x] Implemented — text-embedding-3-small (EMBEDDING_MODEL env)
- [ ] Deferred — sentence-transformers (not required for MVP)

**Vector Database**

- [x] Implemented — Qdrant
- [ ] Deferred — Chroma (not required for MVP)
- [ ] N/A (guideline) — Pinecone (cost scaling)
- [ ] N/A (guideline) — Weaviate (heavy operational complexity)

**Session Memory Design — Redis Stores**

- [x] Implemented — rolling transcript (transcript-cache.service.ts)
- [x] Implemented — session metadata (session-cache.service.ts: setSessionMetadata)
- [x] Implemented — timestamps (TranscriptCacheItem.createdAt, SessionEvent.timestamp)
- [x] Implemented — interaction history (session-cache.service.ts: appendSessionEvent)

**Session Memory Design — Vector DB Stores**

- [x] Implemented — semantic chunks (ResourceChunk table + Qdrant)
- [x] Implemented — embeddings (Embedding table + Qdrant)
- [x] Implemented — document references (payload.resourceId, resourceTitle, sourceUrl in Qdrant)

**LLM Design — Allowed Behaviors**

- [x] Implemented — ask questions (system prompt enforces probing-only)
- [x] Implemented — probe reasoning
- [x] Implemented — identify missing concepts
- [x] Implemented — request clarification

**LLM Design — Forbidden Behaviors**

- [x] Implemented — direct teaching (system prompt prohibits explanations)
- [x] Implemented — giving full answers
- [x] Implemented — changing topics (topic scope enforced in system prompt)
- [x] Implemented — generic conversation

**Prompt Design Principles**

- [x] Implemented — constrain topic scope (subject/topic in system prompt)
- [x] Implemented — prohibit explanations (system prompt: "ONLY asks probing questions")
- [x] Implemented — enforce probing behavior
- [x] Implemented — restrict responses to uploaded materials ("Use only the retrieved context")

**Intermediate Prompt Behavior**

- [x] Implemented — minimal output (temperature 0.4, probing question format)
- [x] Implemented — short probing question
- [x] Implemented — no long reasoning

**Final Prompt Behavior**

- [x] Implemented — full evaluation (generateFinalEvaluation)
- [x] Implemented — conceptual analysis
- [x] Implemented — understanding breakdown
- [x] Implemented — improvement recommendations (follow_up field)

**Suggested Database Schema — Resources**

- [x] Implemented — id
- [x] Implemented — sessionId (via SessionResource join table)
- [x] Implemented — filePath
- [x] Implemented — parsedText

**Suggested Database Schema — TranscriptChunks**

- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — timestamp (startTimeMs, endTimeMs, createdAt)
- [x] Implemented — transcript (text field)

**Suggested Database Schema — Embeddings**

- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — chunkId (resourceChunkId)
- [x] Implemented — vector

**Suggested Database Schema — Evaluations**

- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — summary
- [x] Implemented — weaknesses
- [x] Implemented — confidenceScore (clamped [0, 100])
- [x] Implemented — strengths
- [x] Implemented — missedConcepts
- [x] Implemented — followUp
- [x] Implemented — topicDrift

**API Design — Session**

- [x] Implemented — POST /sessions (create session with subject/topic/goal/resourceIds)
- [x] Implemented — POST /sessions/:id/end
- [x] Implemented — GET /sessions/:id/report (returns FINAL evaluation)
- [x] Implemented — POST /sessions/:id/feedback (on-demand realtime feedback)
- [x] Implemented — POST /sessions/:id/evaluation (on-demand final or rolling evaluation)
- [x] Implemented — POST /sessions/:id/transcript (append transcript chunk via REST)

**API Design — Uploads**

- [x] Implemented — POST /api/parser/parse (multipart file upload, parse + ingest)
- [x] Implemented — POST /api/resources (TEXT + URL resourceTypes; UPLOAD via storageKey)

**API Design — Evaluation**

- [x] Implemented — GET /sessions/:id/report (getSessionReportHandler)

**WebSocket Events — Client → Server**

- [x] Implemented — audio:chunk (base64 audio, rate-limited, buffer-size checked)
- [x] Implemented — session:start (creates session with subject/topic/goal/resourceIds)
- [x] Implemented — session:end (ends session, triggers final evaluation)
  - Note: CONTEXT.MD uses underscore-style names (audio_chunk etc.); code uses colon-style (audio:chunk etc.). Both conventions documented here for frontend integration.

**WebSocket Events — Server → Client**

- [x] Implemented — transcript:chunk (partial transcript after each audio chunk)
- [x] Implemented — analysis:question (probing question from LLM, emitted periodically)
- [x] Implemented — session:summary (final evaluation on session end)
- [x] Implemented — session_summary (alias emitted alongside session:summary for compatibility)
  - Note: CONTEXT.MD refers to these as transcript_update / probing_question / session_summary; socket emits colon-style equivalents.

**Real-Time Processing Logic — Every 2–5 Seconds**

- [x] Implemented — receive audio chunk
- [x] Implemented — transcribe (Whisper API)
- [x] Implemented — append transcript (DB + Redis cache)

**Real-Time Processing Logic — Every 20–30 Seconds**

- [x] Implemented — retrieve relevant chunks (shouldRunAnalysis checks LLM_ANALYSIS_INTERVAL)
- [x] Implemented — LLM analysis
- [x] Implemented — probing question generation (analysis:question event)

**Real-Time Processing Logic — Session End**

- [x] Implemented — full evaluation generation (ensureFinalEvaluation)

**URL Ingestion**

- [x] Implemented — ingestResourceFromUrl in url-ingest.service.ts
- [x] Implemented — SSRF protection: blocks localhost, private IPs (validateUrlSafety)
- [x] Implemented — HTTP/HTTPS-only enforcement
- [x] Implemented — size and timeout limits (URL_MAX_FILE_SIZE_MB, URL_FETCH_TIMEOUT_MS)
- [x] Implemented — HTML stripping and text extraction
- [x] Implemented — document parsing for non-HTML (PDF, etc.) via temp file
- [x] Implemented — wired from createResourceHandler via urlIngestQueue (async BullMQ)
- [x] Implemented — worker started in worker.ts (startUrlIngestWorker)
- [x] Implemented — status transitions: PROCESSING → READY / FAILED

**Security Considerations**

- [x] Implemented — validate uploads (Zod schemas: CreateResourceSchema, session schemas)
- [x] Implemented — rate-limit WebSocket audio chunks (AUDIO_CHUNKS_PER_MINUTE env, sliding window)
- [x] Implemented — audio buffer size check (MAX_FILE_SIZE_MB, default 25 MB)
- [x] Implemented — sanitize parsed text (cleanResourceText; normalizeUnicode/whitespace)
- [x] Implemented — isolate user sessions (session ownership check in all handlers)
- [x] Implemented — resource ownership validation before session attachment (createSession)
- [x] Implemented — secure API keys (env validation; keys not logged)
- [x] Implemented — SSRF protection for URL ingestion

**Analytics**

- [x] Implemented — session.created (session.service.ts)
- [x] Implemented — session.ended (session.service.ts)
- [x] Implemented — resource.ingestion.queued (resource.controller.ts for URL)
- [x] Implemented — resource.ingestion.started (resource-ingest.service.ts + url-ingest.service.ts)
- [x] Implemented — resource.ingestion.completed (resource-ingest.service.ts + url-ingest.service.ts)
- [x] Implemented — resource.ingestion.failed (resource-ingest.service.ts + url-ingest.service.ts)
- [x] Implemented — evaluation.rolling (evaluation.service.ts)
- [x] Implemented — evaluation.final (evaluation.service.ts)
- [ ] Deferred — speaking confidence / hesitation detection (future ML feature)
- [ ] Deferred — concept coverage / explanation depth / semantic consistency (future analytics)
- [ ] Deferred — topic drift (topicDrift field exists in Evaluation; LLM emits it)

**Scaling Considerations — Future**

- [ ] N/A (observation) — STT (CPU/GPU heavy)
- [ ] N/A (observation) — Vector Search (grows with document count)
- [ ] N/A (observation) — LLM Calls (main cost driver)

**Scaling Strategy**

- [ ] N/A (architecture choice) — single server for early stage
- [ ] Deferred — STT worker (separate process)
- [ ] Deferred — embedding worker
- [ ] Deferred — LLM worker
- [ ] Deferred — microservices + queues (large scale)

**Major Risks — Risk 1 Mitigation (Hallucinated Evaluations)**

- [x] Implemented — constrained prompts (system prompts enforce topic/no-teaching)
- [x] Implemented — retrieval grounding (LLM receives retrieved context only)
- [x] Implemented — domain restriction (domain.service.ts enforces allowed subjects)

**Major Risks — Risk 2 Mitigation (Generic Questions)**

- [x] Implemented — strict probing prompts
- [x] Implemented — topic constraints (scope in every LLM call)
- [x] Implemented — retrieval-only context

**Major Risks — Risk 3 Mitigation (High Costs)**

- [x] Implemented — periodic reasoning only (shouldRunAnalysis, LLM_ANALYSIS_INTERVAL)
- [x] Implemented — lightweight models (selectable via REALTIME_MODEL / FINAL_EVALUATION_MODEL env)
- [x] Implemented — cached retrieval (Redis transcript window)

**MVP Milestones**

- [x] Phase 1 — upload resources, parse text, generate embeddings
- [x] Phase 2 — websocket audio streaming, speech-to-text pipeline
- [x] Phase 3 — vector retrieval, LLM probing questions
- [x] Phase 4 — final evaluation report
- [ ] Phase 5 — advanced analytics, optimization, scaling (deferred)

**Non-Goals**

- [ ] N/A (product constraint) — build general AI assistant
- [ ] N/A (product constraint) — support all subjects immediately
- [ ] N/A (product constraint) — add social features early
- [ ] N/A (product constraint) — add avatars initially
- [ ] N/A (product constraint) — overengineer multi-agent systems

**Cost Optimization**

- [x] Implemented — STT only on every audio chunk
- [x] Implemented — LLM reasoning only every ~30 seconds (LLM_ANALYSIS_INTERVAL)
- [x] Implemented — deep final analysis only at session end

**Evidence References**

- URL ingestion wired: resource.controller.ts → urlIngestQueue.add → url-ingest.worker.ts → ingestResourceFromUrl
- SSRF protection: url-ingest.service.ts validateUrlSafety()
- Confidence score clamped [0-100]: evaluation.service.ts clampConfidenceScore()
- Resource ownership: session.service.ts createSession() validates prisma.resource.findMany with userId filter
- Audio size limit: realtime.socket.ts audio:chunk handler checks MAX_FILE_SIZE_MB
- Analytics: analytics.service.ts trackAnalyticsEvent() (no-op when ENABLE_ANALYTICS=false)
- Worker startup: worker.ts → startUrlIngestWorker()
- Session report API: GET /api/sessions/:id/report → getSessionReportHandler
- Socket final summary: session:end → ensureFinalEvaluation → emit session:summary + session_summary
