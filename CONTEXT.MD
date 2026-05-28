# Context.md

# Project Name

Feynman AI

---

# Project Vision

An AI-powered learning platform where users learn by teaching.

The platform evaluates a user's understanding of a topic by making them verbally explain concepts from uploaded learning resources. Instead of directly teaching, the AI acts like an intelligent examiner or study partner that continuously probes for conceptual gaps.

The system:

- listens to the user in real time
- transcribes speech continuously
- retrieves relevant knowledge from uploaded resources
- asks deep follow-up questions
- identifies weak understanding
- generates a final mastery evaluation

The system should NEVER become a generic chatbot.

Its role is:

- evaluate understanding
- probe reasoning
- identify conceptual gaps
- force deeper explanations

---

# Core Philosophy

Most AI learning products optimize for:

- fast answers
- summaries
- convenience

This project optimizes for:

- active recall
- conceptual articulation
- reasoning depth
- teaching-based learning

The user learns by explaining.

---

# Primary MVP Goal

Build a real-time AI tutor that:

1. accepts uploaded learning resources
2. processes and embeds them
3. listens to user explanations in real time
4. asks targeted follow-up questions
5. evaluates understanding quality

---

# Scope Constraints

The system MUST remain domain constrained.

Do NOT support:

- all subjects
- general-purpose tutoring
- open-ended chatting

Initial domain recommendation:

- mathematics
  OR
- physics

Reason:

- easier benchmarking
- clearer conceptual correctness
- better evaluation structure
- less hallucination risk

---

# High-Level System Design

```text
User
 ├── uploads resources
 ├── selects topic
 ├── explains verbally
 └── receives evaluation

Frontend
 ├── audio capture
 ├── websocket streaming
 ├── live transcript display
 ├── feedback UI
 └── session dashboard

Backend (Express)
 ├── websocket server
 ├── session manager
 ├── transcription pipeline
 ├── embedding pipeline
 ├── vector retrieval
 ├── llm orchestrator
 ├── evaluation engine
 └── analytics

Infrastructure
 ├── Redis
 ├── Vector DB
 ├── Object Storage
 └── LLM APIs
```

---

# Core Data Flow

## Step 1 — Resource Upload

User uploads:

- PDF
- image
- notes
- text files

Backend:

1. detects file type
2. extracts text
3. cleans text
4. chunks content
5. generates embeddings
6. stores embeddings in vector DB

Raw extracted text is also stored.

---

## Step 2 — Topic Initialization

User selects:

- subject
- topic
- learning goal

This becomes:

- the semantic anchor
- retrieval filter
- evaluation scope

---

## Step 3 — Real-Time Speaking Session

Frontend:

- captures microphone audio
- chunks audio every 2–5 seconds
- streams chunks via WebSocket

Backend:

- buffers audio
- runs speech-to-text continuously
- appends transcript to rolling memory

---

## Step 4 — Rolling Analysis

Every ~20–30 seconds:

1. recent transcript is normalized
2. transcript is embedded
3. vector search retrieves relevant chunks
4. LLM receives:
   - recent transcript
   - retrieved context
   - evaluation instructions

LLM responds ONLY with:

- probing questions
- clarification requests
- gap detection

NOT explanations.

---

## Step 5 — Final Evaluation

At session end:

1. full transcript assembled
2. understanding analysis generated
3. conceptual gaps identified
4. confidence score computed
5. final report returned

---

# User Flow

## Upload Phase

User:

1. creates session
2. uploads learning resources
3. selects topic
4. starts session

---

## Learning Phase

User:

1. explains concepts verbally
2. continues speaking naturally
3. receives periodic probing questions
4. clarifies weak explanations

---

## Evaluation Phase

System generates:

- understanding summary
- weak areas
- missed concepts
- follow-up recommendations
- conceptual confidence score

---

# Technical Architecture

# Frontend

## Stack

- Next.js
- React
- Tailwind
- WebSocket client

## Responsibilities

- microphone access
- audio chunking
- websocket communication
- session UI
- transcript display
- question display
- analytics display

---

# Backend

## Stack

- Node.js
- Express
- ws (WebSocket library)

## Responsibilities

- session orchestration
- websocket handling
- authentication
- transcript processing
- LLM coordination
- vector retrieval
- analytics

---

# Audio Pipeline

## Recommended Flow

```text
Mic Input
 → MediaRecorder API
 → WebM/Opus chunks
 → WebSocket stream
 → Backend buffer
 → Whisper/Faster-Whisper
 → Transcript
```

---

# Why WebSockets

WebSockets are required because:

- continuous streaming
- low latency
- bidirectional communication
- real-time feedback
- interruption-free speaking

Do NOT use polling.

---

# Speech-to-Text Design

## Recommendation

Perform STT on backend.

Reasons:

- centralized pipeline
- better models
- stable behavior
- security
- easier orchestration

---

# STT Options

## Recommended

- Faster-Whisper

## Alternatives

- Whisper API
- Deepgram
- AssemblyAI

---

# Resource Processing Pipeline

```text
Upload
 → Parse
 → OCR (if needed)
 → Clean
 → Chunk
 → Embed
 → Store
```

---

# PDF / OCR Tools

## Recommended

- Docling
- OpenDataLoader

## OCR

- Tesseract
- OCR.space

---

# Chunking Strategy

## Recommended Chunk Size

- 300–800 tokens
- overlap: 10–20%

Reason:

- preserves semantic continuity
- improves retrieval quality

---

# Embedding Pipeline

## Recommended Embedding Models

### OpenAI

- text-embedding-3-small

### Open Source

- sentence-transformers

---

# Vector Database

## Recommended

- Qdrant
- Chroma

## Avoid Initially

- Pinecone (cost scaling)
- Weaviate (heavy operational complexity)

---

# Retrieval Flow

```text
User Transcript
 → Embedding
 → Vector Search
 → Top Relevant Chunks
 → LLM Context
```

Important:
The LLM receives actual text chunks.
NOT raw embeddings.

---

# Session Memory Design

## Redis Stores

- rolling transcript
- session metadata
- timestamps
- interaction history

## Vector DB Stores

- semantic chunks
- embeddings
- document references

---

# LLM Design

## Allowed Behaviors

- ask questions
- probe reasoning
- identify missing concepts
- request clarification

## Forbidden Behaviors

- direct teaching
- giving full answers
- changing topics
- generic conversation

---

# Prompt Design Principles

System prompts MUST:

- constrain topic scope
- prohibit explanations
- enforce probing behavior
- restrict responses to uploaded materials

---

# Intermediate Prompt Behavior

Every 20–30 seconds:

- minimal output
- short probing question
- no long reasoning

---

# Final Prompt Behavior

At session end:

- full evaluation
- conceptual analysis
- understanding breakdown
- improvement recommendations

---

# Suggested Database Schema

## Users

- id
- email
- createdAt

## Sessions

- id
- userId
- topic
- startedAt
- endedAt

## Resources

- id
- sessionId
- filePath
- parsedText

## TranscriptChunks

- id
- sessionId
- timestamp
- transcript

## Embeddings

- id
- sessionId
- chunkId
- vector

## Evaluations

- id
- sessionId
- summary
- weaknesses
- confidenceScore

---

# API Design

# REST APIs

## Session

### POST /sessions/create

Create session

### POST /sessions/:id/end

End session

---

## Uploads

### POST /upload

Upload resources

---

## Evaluation

### GET /sessions/:id/report

Get final evaluation

---

# WebSocket Events

## Client → Server

### audio_chunk

Streams audio chunk

### session_start

Starts speaking session

### session_end

Ends session

---

## Server → Client

### transcript_update

Partial transcript

### probing_question

LLM follow-up question

### session_summary

Final evaluation

---

# Real-Time Processing Logic

## Every 2–5 Seconds

- receive audio chunk
- transcribe
- append transcript

## Every 20–30 Seconds

- retrieve relevant chunks
- LLM analysis
- probing question generation

## Session End

- full evaluation generation

---

# Cost Optimization Strategy

## Critical Rule

Do NOT send every chunk to the LLM.

That is:

- expensive
- noisy
- inefficient

---

## Proper Strategy

### Frequent

STT only

### Periodic

LLM reasoning

### Final

Deep analysis

---

# Scaling Considerations

# Future Bottlenecks

## STT

CPU/GPU heavy

## Vector Search

grows with document count

## LLM Calls

main cost driver

---

# Scaling Strategy

## Early Stage

single server

## Mid Stage

separate workers:

- STT worker
- embedding worker
- LLM worker

## Large Scale

microservices + queues

---

# Security Considerations

- validate uploads
- rate-limit websocket connections
- sanitize parsed text
- isolate user sessions
- secure API keys
- avoid frontend secret exposure

---

# Analytics Ideas

Future metrics:

- speaking confidence
- hesitation detection
- concept coverage
- explanation depth
- semantic consistency
- topic drift

---

# Major Risks

## Risk 1 — Hallucinated Evaluations

LLM incorrectly judges user understanding.

Mitigation:

- constrained prompts
- retrieval grounding
- domain restriction

---

## Risk 2 — Generic Questions

AI becomes shallow chatbot.

Mitigation:

- strict probing prompts
- topic constraints
- retrieval-only context

---

## Risk 3 — High Costs

Continuous LLM calls become expensive.

Mitigation:

- periodic reasoning only
- lightweight models
- cached retrieval

---

# MVP Milestones

# Phase 1

- upload resources
- parse text
- generate embeddings

# Phase 2

- websocket audio streaming
- speech-to-text pipeline

# Phase 3

- vector retrieval
- LLM probing questions

# Phase 4

- final evaluation report

# Phase 5

- analytics
- optimization
- scaling

---

# Non-Goals (Important)

Do NOT:

- build general AI assistant
- support all subjects immediately
- add social features early
- add avatars initially
- overengineer multi-agent systems

Focus on:

- reliable understanding evaluation
- deep conceptual probing
- strong retrieval grounding

---

# Final Product Goal

Create an AI system that evaluates whether someone truly understands a concept by forcing them to explain it deeply, clearly, and consistently using constrained, retrieval-grounded conversational probing.
