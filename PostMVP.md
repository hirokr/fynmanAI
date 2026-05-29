## Post-MVP Backlog

Do not spend hackathon time on these unless the MVP is already demo-ready.

### STT Provider Abstraction

**Why post-MVP:**
- OpenAI Whisper-compatible transcription is enough for the demo.
- Deepgram, AssemblyAI, and Faster-Whisper support add complexity without improving the core story.

**Later completion approach:**
- Add a provider interface.
- Implement provider-specific adapters.
- Normalize timestamps, confidence, and transcript output.

### Vector DB Provider Abstraction

**Why post-MVP:**
- Qdrant is already the active implementation.
- Chroma support is not needed for a hackathon demo.

**Later completion approach:**
- Define a vector store interface.
- Wrap Qdrant first.
- Add Chroma only if deployment needs it.

### Advanced Domain Taxonomy

**Why post-MVP:**
- MVP can restrict subjects to `math` and `physics` with the existing domain check.
- Full topic taxonomy and benchmark rubrics are product-quality work.

**Later completion approach:**
- Add allowed topic lists.
- Version rubrics.
- Add domain-specific correctness examples.

### Advanced Analytics Calibration

**Why post-MVP:**
- Current analytics are enough for lightweight demo signals.
- Deep conceptual analytics require calibration data.

**Later completion approach:**
- Keep heuristic metrics.
- Add rubric-scored model metrics.
- Test against known strong, weak, shallow, and off-topic explanations.

### Full Object Storage Lifecycle

**Why post-MVP:**
- Durable S3 storage is useful, but not essential if the demo uses text resources or local parsed files.

**Later completion approach:**
- Persist uploaded artifacts to S3.
- Save durable `storageKey` values.
- Ensure retention deletes files, database rows, and vector points.

### True Background Rolling Analysis Scheduler

**Why post-MVP:**
- Chunk-triggered analysis is acceptable for a hackathon MVP.
- A scheduler matters more for long real sessions and production reliability.

**Later completion approach:**
- Track active sessions in Redis.
- Run analysis every 20-30 seconds while active.
- Use locks to avoid duplicate LLM calls.

### Full Test Suite

**Why post-MVP:**
- The MVP needs one reliable smoke test.
- Broad service and worker coverage can come after the demo.

**Later completion approach:**
- Add tests for resource ingestion, Qdrant retrieval, Socket.IO audio, queued workers, malformed LLM output, retention, and provider adapters.
