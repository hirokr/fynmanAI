
**Legend**
- [x] Implemented
- [ ] Partial
- [ ] Missing
- [ ] N/A (frontend/product)

**Project Vision**
- [x] Implemented — listens to the user in real time
- [x] Implemented — transcribes speech continuously
- [x] Implemented — retrieves relevant knowledge from uploaded resources
- [x] Implemented — asks deep follow-up questions
- [x] Implemented — identifies weak understanding
- [x] Implemented — generates a final mastery evaluation
- [x] Implemented — evaluate understanding
- [x] Implemented — probe reasoning
- [x] Implemented — identify conceptual gaps
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
- [x] Implemented — all subjects are blocked by domain restriction
- [x] Implemented — general-purpose tutoring is blocked by domain restriction
- [x] Implemented — open-ended chatting is blocked by strict evaluator prompts
- [x] Implemented — mathematics
- [x] Implemented — physics
- [ ] N/A (rationale) — easier benchmarking
- [ ] N/A (rationale) — clearer conceptual correctness
- [ ] N/A (rationale) — better evaluation structure
- [ ] N/A (rationale) — less hallucination risk

**System Design (User)**
- [ ] N/A (user action) — uploads resources
- [ ] N/A (user action) — selects topic
- [ ] N/A (user action) — explains verbally
- [x] Implemented — receives evaluation

**System Design (Frontend)**
- [ ] N/A (frontend) — audio capture
- [ ] N/A (frontend) — websocket streaming
- [ ] N/A (frontend) — live transcript display
- [ ] N/A (frontend) — feedback UI
- [ ] N/A (frontend) — session dashboard

**System Design (Backend)**
- [x] Implemented — websocket server
- [x] Implemented — session manager
- [x] Implemented — transcription pipeline
- [x] Implemented — embedding pipeline
- [x] Implemented — vector retrieval
- [x] Implemented — llm orchestrator
- [x] Implemented — evaluation engine
- [x] Implemented — analytics

**System Design (Infrastructure)**
- [x] Implemented — Redis
- [x] Implemented — Vector DB
- [x] Implemented — Object Storage
- [x] Implemented — LLM APIs

**Core Data Flow Step 1 — Resource Upload**
- [x] Implemented — PDF
- [x] Implemented — image
- [x] Implemented — notes
- [x] Implemented — text files
- [x] Implemented — detects file type
- [x] Implemented — extracts text
- [x] Implemented — cleans text
- [x] Implemented — chunks content
- [x] Implemented — generates embeddings
- [x] Implemented — stores embeddings in vector DB

**Core Data Flow Step 2 — Topic Initialization**
- [x] Implemented — subject
- [x] Implemented — topic
- [x] Implemented — learning goal
- [x] Implemented — the semantic anchor
- [x] Implemented — retrieval filter
- [x] Implemented — evaluation scope

**Core Data Flow Step 3 — Real-Time Speaking Session**
- [ ] N/A (frontend) — captures microphone audio
- [ ] N/A (frontend) — chunks audio every 2–5 seconds
- [ ] N/A (frontend) — streams chunks via WebSocket
- [x] Implemented — buffers audio
- [x] Implemented — runs speech-to-text continuously
- [x] Implemented — appends transcript to rolling memory

**Core Data Flow Step 4 — Rolling Analysis**
- [x] Implemented — recent transcript is normalized
- [x] Implemented — transcript is embedded
- [x] Implemented — vector search retrieves relevant chunks
- [x] Implemented — LLM receives recent transcript
- [x] Implemented — LLM receives retrieved context
- [x] Implemented — LLM receives evaluation instructions
- [x] Implemented — probing questions
- [x] Implemented — clarification requests
- [x] Implemented — gap detection

**Core Data Flow Step 5 — Final Evaluation**
- [x] Implemented — full transcript assembled
- [x] Implemented — understanding analysis generated
- [x] Implemented — conceptual gaps identified
- [x] Implemented — confidence score computed
- [x] Implemented — final report returned

**User Flow — Upload Phase**
- [x] Implemented — creates session
- [x] Implemented — uploads learning resources
- [x] Implemented — selects topic
- [x] Implemented — starts session

**User Flow — Learning Phase**
- [ ] N/A (user action) — explains concepts verbally
- [ ] N/A (user action) — continues speaking naturally
- [x] Implemented — receives periodic probing questions
- [ ] N/A (user action) — clarifies weak explanations

**User Flow — Evaluation Phase**
- [x] Implemented — understanding summary
- [x] Implemented — weak areas
- [x] Implemented — missed concepts
- [x] Implemented — follow-up recommendations
- [x] Implemented — conceptual confidence score

**Technical Architecture — Frontend Stack**
- [ ] N/A (frontend) — Next.js
- [ ] N/A (frontend) — React
- [ ] N/A (frontend) — Tailwind
- [ ] N/A (frontend) — WebSocket client

**Technical Architecture — Frontend Responsibilities**
- [ ] N/A (frontend) — microphone access
- [ ] N/A (frontend) — audio chunking
- [ ] N/A (frontend) — websocket communication
- [ ] N/A (frontend) — session UI
- [ ] N/A (frontend) — transcript display
- [ ] N/A (frontend) — question display
- [ ] N/A (frontend) — analytics display

**Technical Architecture — Backend Stack**
- [x] Implemented — Node.js
- [x] Implemented — Express
- [x] Implemented — ws (WebSocket library)

**Technical Architecture — Backend Responsibilities**
- [x] Implemented — session orchestration
- [x] Implemented — websocket handling
- [x] Implemented — authentication
- [x] Implemented — transcript processing
- [x] Implemented — LLM coordination
- [x] Implemented — vector retrieval
- [x] Implemented — analytics

**Why WebSockets**
- [ ] N/A (rationale) — continuous streaming
- [ ] N/A (rationale) — low latency
- [ ] N/A (rationale) — bidirectional communication
- [ ] N/A (rationale) — real-time feedback
- [ ] N/A (rationale) — interruption-free speaking

**Speech-to-Text Design — Reasons**
- [ ] N/A (rationale) — centralized pipeline
- [ ] N/A (rationale) — better models
- [ ] N/A (rationale) — stable behavior
- [ ] N/A (rationale) — security
- [ ] N/A (rationale) — easier orchestration

**STT Options**
- [ ] N/A (provider alternative) — Faster-Whisper
- [x] Implemented — Whisper API
- [ ] N/A (provider alternative) — Deepgram
- [ ] N/A (provider alternative) — AssemblyAI


**Chunking Strategy**
- [x] Implemented — 300–800 tokens
- [x] Implemented — overlap: 10–20%

**Embedding Models**
- [x] Implemented — text-embedding-3-small
- [ ] N/A (provider alternative) — sentence-transformers

**Vector Database**
- [x] Implemented — Qdrant
- [ ] N/A (provider alternative) — Chroma
- [ ] N/A (guideline) — Pinecone (cost scaling)
- [ ] N/A (guideline) — Weaviate (heavy operational complexity)

**Session Memory Design — Redis Stores**
- [x] Implemented — rolling transcript
- [x] Implemented — session metadata
- [x] Implemented — timestamps
- [x] Implemented — interaction history

**Session Memory Design — Vector DB Stores**
- [x] Implemented — semantic chunks
- [x] Implemented — embeddings
- [x] Implemented — document references

**LLM Design — Allowed Behaviors**
- [x] Implemented — ask questions
- [x] Implemented — probe reasoning
- [x] Implemented — identify missing concepts
- [x] Implemented — request clarification

**LLM Design — Forbidden Behaviors**
- [x] Implemented — direct teaching
- [x] Implemented — giving full answers
- [x] Implemented — changing topics
- [x] Implemented — generic conversation

**Prompt Design Principles**
- [x] Implemented — constrain topic scope
- [x] Implemented — prohibit explanations
- [x] Implemented — enforce probing behavior
- [x] Implemented — restrict responses to uploaded materials

**Intermediate Prompt Behavior**
- [x] Implemented — minimal output
- [x] Implemented — short probing question
- [x] Implemented — no long reasoning

**Final Prompt Behavior**
- [x] Implemented — full evaluation
- [x] Implemented — conceptual analysis
- [x] Implemented — understanding breakdown
- [x] Implemented — improvement recommendations

**Suggested Database Schema — Users**
- [x] Implemented — id
- [x] Implemented — email
- [x] Implemented — createdAt

**Suggested Database Schema — Sessions**
- [x] Implemented — id
- [x] Implemented — userId
- [x] Implemented — topic
- [x] Implemented — startedAt
- [x] Implemented — endedAt

**Suggested Database Schema — Resources**
- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — filePath
- [x] Implemented — parsedText

**Suggested Database Schema — TranscriptChunks**
- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — timestamp
- [x] Implemented — transcript

**Suggested Database Schema — Embeddings**
- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — chunkId
- [x] Implemented — vector

**Suggested Database Schema — Evaluations**
- [x] Implemented — id
- [x] Implemented — sessionId
- [x] Implemented — summary
- [x] Implemented — weaknesses
- [x] Implemented — confidenceScore

**API Design — Session**
- [x] Implemented — POST /sessions/create
- [x] Implemented — POST /sessions/:id/end

**API Design — Uploads**
- [x] Implemented — POST /upload

**API Design — Evaluation**
- [x] Implemented — GET /sessions/:id/report

**WebSocket Events — Client → Server**
- [x] Implemented — audio_chunk
- [x] Implemented — session_start
- [x] Implemented — session_end

**WebSocket Events — Server → Client**
- [x] Implemented — transcript_update
- [x] Implemented — probing_question
- [x] Implemented — session_summary

**Real-Time Processing Logic — Every 2–5 Seconds**
- [x] Implemented — receive audio chunk
- [x] Implemented — transcribe
- [x] Implemented — append transcript

**Real-Time Processing Logic — Every 20–30 Seconds**
- [x] Implemented — retrieve relevant chunks
- [x] Implemented — LLM analysis
- [x] Implemented — probing question generation

**Real-Time Processing Logic — Session End**
- [x] Implemented — full evaluation generation

**Cost Optimization Strategy**
- [x] Implemented — STT only
- [x] Implemented — LLM reasoning
- [x] Implemented — Deep analysis

**Scaling Considerations — Future Bottlenecks**
- [ ] N/A (observation) — STT
- [ ] N/A (observation) — Vector Search
- [ ] N/A (observation) — LLM Calls

**Scaling Strategy — Early Stage**
- [ ] N/A (architecture choice) — single server

**Scaling Strategy — Mid Stage**
- [ ] N/A (future scaling) — STT worker
- [ ] N/A (future scaling) — embedding worker
- [ ] N/A (future scaling) — LLM worker

**Scaling Strategy — Large Scale**
- [ ] N/A (future scaling) — microservices + queues

**Security Considerations**
- [x] Implemented — validate uploads
- [x] Implemented — rate-limit websocket connections
- [x] Implemented — sanitize parsed text
- [x] Implemented — isolate user sessions
- [x] Implemented — secure API keys
- [ ] N/A (frontend) — avoid frontend secret exposure

**Analytics Ideas**
- [x] Implemented — speaking confidence
- [x] Implemented — hesitation detection
- [x] Implemented — concept coverage
- [x] Implemented — explanation depth
- [x] Implemented — semantic consistency
- [x] Implemented — topic drift

**Major Risks — Risk 1 Mitigation**
- [x] Implemented — constrained prompts
- [x] Implemented — retrieval grounding
- [x] Implemented — domain restriction

**Major Risks — Risk 2 Mitigation**
- [x] Implemented — strict probing prompts
- [x] Implemented — topic constraints
- [x] Implemented — retrieval-only context

**Major Risks — Risk 3 Mitigation**
- [x] Implemented — periodic reasoning only
- [x] Implemented — lightweight models
- [x] Implemented — cached retrieval

**MVP Milestones — Phase 1**
- [x] Implemented — upload resources
- [x] Implemented — parse text
- [x] Implemented — generate embeddings

**MVP Milestones — Phase 2**
- [x] Implemented — websocket audio streaming
- [x] Implemented — speech-to-text pipeline

**MVP Milestones — Phase 3**
- [x] Implemented — vector retrieval
- [x] Implemented — LLM probing questions

**MVP Milestones — Phase 4**
- [x] Implemented — final evaluation report

**MVP Milestones — Phase 5**
- [x] Implemented — analytics
- [x] Implemented — optimization
- [x] Implemented — scaling

**Non-Goals**
- [ ] N/A (product constraint) — build general AI assistant
- [ ] N/A (product constraint) — support all subjects immediately
- [ ] N/A (product constraint) — add social features early
- [ ] N/A (product constraint) — add avatars initially
- [ ] N/A (product constraint) — overengineer multi-agent systems

**Focus**
- [x] Implemented — reliable understanding evaluation
- [x] Implemented — deep conceptual probing
- [x] Implemented — strong retrieval grounding

**URL Ingestion**
- [x] Implemented — `createResourceHandler` queues URL ingestion when `sourceType === 'URL'`.
- [x] Implemented — URL fetch/extract enforces size and timeout limits.
- [x] Implemented — HTML/text extraction and non-HTML parsing reuse the existing parser flow.
- [x] Implemented — ingestion status updates use PROCESSING/READY/FAILED.
- [x] Implemented — URL ingestion reuses `ingestResourceText` for chunking and embeddings.
- [x] Implemented — fetched artifacts can be persisted to object storage when S3 is configured.
- [x] Implemented — URL ingestion runs asynchronously through the BullMQ worker.
