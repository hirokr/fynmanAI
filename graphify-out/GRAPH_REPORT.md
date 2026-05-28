# Graph Report - /media/hirokr/develop/Hackathons/fynmanAI/server  (2026-05-28)

## Corpus Check
- 74 files · ~71,192 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1265 nodes · 1421 edges · 40 communities (33 shown, 7 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Prisma Internal Types|Prisma Internal Types]]
- [[_COMMUNITY_Prisma Session Model|Prisma Session Model]]
- [[_COMMUNITY_Prisma User Model|Prisma User Model]]
- [[_COMMUNITY_Prisma Resource Model|Prisma Resource Model]]
- [[_COMMUNITY_Prisma SessionResource Model|Prisma SessionResource Model]]
- [[_COMMUNITY_Prisma ResourceChunk Model|Prisma ResourceChunk Model]]
- [[_COMMUNITY_Prisma TranscriptChunk Model|Prisma TranscriptChunk Model]]
- [[_COMMUNITY_Prisma Evaluation Model|Prisma Evaluation Model]]
- [[_COMMUNITY_Prisma RefreshToken Model|Prisma RefreshToken Model]]
- [[_COMMUNITY_Prisma Input Types|Prisma Input Types]]
- [[_COMMUNITY_AI Service|AI Service]]
- [[_COMMUNITY_Server Bootstrap|Server Bootstrap]]
- [[_COMMUNITY_Document Pipeline|Document Pipeline]]
- [[_COMMUNITY_Prisma Namespace Browser|Prisma Namespace Browser]]
- [[_COMMUNITY_Prisma Client Types|Prisma Client Types]]
- [[_COMMUNITY_Redis Cache|Redis Cache]]
- [[_COMMUNITY_API Responses|API Responses]]
- [[_COMMUNITY_Session Service|Session Service]]
- [[_COMMUNITY_User Service|User Service]]
- [[_COMMUNITY_Auth Utilities|Auth Utilities]]
- [[_COMMUNITY_Email Utilities|Email Utilities]]
- [[_COMMUNITY_Document Parser|Document Parser]]
- [[_COMMUNITY_Python Parser|Python Parser]]
- [[_COMMUNITY_Auth Validation|Auth Validation]]
- [[_COMMUNITY_UploadThings Utilities|UploadThings Utilities]]
- [[_COMMUNITY_Queue Connection|Queue Connection]]
- [[_COMMUNITY_Session Validation|Session Validation]]
- [[_COMMUNITY_Speech To Text|Speech To Text]]
- [[_COMMUNITY_User Types|User Types]]
- [[_COMMUNITY_Arcjet Config|Arcjet Config]]
- [[_COMMUNITY_Auth Request Types|Auth Request Types]]
- [[_COMMUNITY_Express Types|Express Types]]
- [[_COMMUNITY_Resource Validation|Resource Validation]]
- [[_COMMUNITY_Environment Config|Environment Config]]

## God Nodes (most connected - your core abstractions)
1. `sendApiError()` - 23 edges
2. `sendApiSuccess()` - 21 edges
3. `ingestResourceText()` - 10 edges
4. `signup()` - 9 edges
5. `generateRealtimeFeedback()` - 8 edges
6. `retrieveContext()` - 7 edges
7. `changePassword()` - 7 edges
8. `deleteAccount()` - 7 edges
9. `PythonDocumentParser` - 6 edges
10. `generateFinalEvaluation()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `signup()` --calls--> `Boolean`  [INFERRED]
  server/src/controllers/auth.controller.ts → server/src/generated/internal/prismaNamespace.ts
- `appendTranscriptChunk()` --calls--> `appendTranscriptCache()`  [INFERRED]
  server/src/services/session.service.ts → server/src/services/transcript-cache.service.ts
- `endSessionHandler()` --calls--> `endSession()`  [INFERRED]
  server/src/controllers/session.controller.ts → server/src/services/session.service.ts
- `requestRealtimeFeedbackHandler()` --calls--> `generateRealtimeFeedback()`  [INFERRED]
  server/src/controllers/session.controller.ts → server/src/services/evaluation.service.ts
- `requestFinalEvaluationHandler()` --calls--> `generateRealtimeFeedback()`  [INFERRED]
  server/src/controllers/session.controller.ts → server/src/services/evaluation.service.ts

## Communities (40 total, 7 thin omitted)

### Community 0 - "Prisma Internal Types"
Cohesion: 0.02
Nodes (121): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, BooleanFieldRefInput, Bytes (+113 more)

### Community 1 - "Prisma Session Model"
Cohesion: 0.02
Nodes (113): AggregateSession, EnumSessionStatusFieldUpdateOperationsInput, GetSessionAggregateType, GetSessionGroupByPayload, Prisma__SessionClient, Session$evaluationsArgs, Session$resourcesArgs, Session$transcriptChunksArgs (+105 more)

### Community 2 - "Prisma User Model"
Cohesion: 0.02
Nodes (111): AggregateUser, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, EnumGenderFieldUpdateOperationsInput, GetUserAggregateType, GetUserGroupByPayload, NullableDateTimeFieldUpdateOperationsInput, NullableIntFieldUpdateOperationsInput (+103 more)

### Community 3 - "Prisma Resource Model"
Cohesion: 0.02
Nodes (103): AggregateResource, EnumResourceStatusFieldUpdateOperationsInput, EnumResourceTypeFieldUpdateOperationsInput, GetResourceAggregateType, GetResourceGroupByPayload, Prisma__ResourceClient, Resource$chunksArgs, Resource$sessionsArgs (+95 more)

### Community 4 - "Prisma SessionResource Model"
Cohesion: 0.02
Nodes (91): AggregateSessionResource, GetSessionResourceAggregateType, GetSessionResourceGroupByPayload, Prisma__SessionResourceClient, SessionResourceAggregateArgs, SessionResourceCountAggregateInputType, SessionResourceCountAggregateOutputType, SessionResourceCountArgs (+83 more)

### Community 5 - "Prisma ResourceChunk Model"
Cohesion: 0.02
Nodes (82): AggregateResourceChunk, GetResourceChunkAggregateType, GetResourceChunkGroupByPayload, IntFieldUpdateOperationsInput, Prisma__ResourceChunkClient, ResourceChunkAggregateArgs, ResourceChunkAvgAggregateInputType, ResourceChunkAvgAggregateOutputType (+74 more)

### Community 6 - "Prisma TranscriptChunk Model"
Cohesion: 0.02
Nodes (81): AggregateTranscriptChunk, GetTranscriptChunkAggregateType, GetTranscriptChunkGroupByPayload, Prisma__TranscriptChunkClient, TranscriptChunkAggregateArgs, TranscriptChunkAvgAggregateInputType, TranscriptChunkAvgAggregateOutputType, TranscriptChunkAvgOrderByAggregateInput (+73 more)

### Community 7 - "Prisma Evaluation Model"
Cohesion: 0.03
Nodes (76): AggregateEvaluation, EnumEvaluationTypeFieldUpdateOperationsInput, EvaluationAggregateArgs, EvaluationCountAggregateInputType, EvaluationCountAggregateOutputType, EvaluationCountArgs, EvaluationCountOrderByAggregateInput, EvaluationCreateArgs (+68 more)

### Community 8 - "Prisma RefreshToken Model"
Cohesion: 0.03
Nodes (75): AggregateRefreshToken, GetRefreshTokenAggregateType, GetRefreshTokenGroupByPayload, Prisma__RefreshTokenClient, RefreshTokenAggregateArgs, RefreshTokenCountAggregateInputType, RefreshTokenCountAggregateOutputType, RefreshTokenCountArgs (+67 more)

### Community 9 - "Prisma Input Types"
Cohesion: 0.03
Nodes (61): BoolFilter, BoolWithAggregatesFilter, DateTimeFilter, DateTimeNullableFilter, DateTimeNullableWithAggregatesFilter, DateTimeWithAggregatesFilter, EnumEvaluationTypeFilter, EnumEvaluationTypeWithAggregatesFilter (+53 more)

### Community 10 - "AI Service"
Cohesion: 0.05
Nodes (49): buildRequestUrl(), ChatCompletionOptions, ChatMessage, ChatPurpose, DEFAULT_BASE_URLS, EmbeddingOptions, generateChatCompletion(), generateEmbedding() (+41 more)

### Community 11 - "Server Bootstrap"
Cohesion: 0.05
Nodes (30): envSchema, issues, optionalBoolean, optionalNumber, optionalString, parsed, logger, getS3Client() (+22 more)

### Community 12 - "Document Pipeline"
Cohesion: 0.08
Nodes (14): isSupportedFile(), normalizeExtension(), OCR_CAPABLE_EXTENSIONS, SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES, DocumentParserConfig, DocumentParserError, DocumentParserService (+6 more)

### Community 13 - "Prisma Namespace Browser"
Cohesion: 0.07
Nodes (24): Evaluation, RefreshToken, Resource, ResourceChunk, Session, SessionResource, TranscriptChunk, User (+16 more)

### Community 14 - "Prisma Client Types"
Cohesion: 0.08
Nodes (20): adapter, prisma, Evaluation, PrismaClient, RefreshToken, Resource, ResourceChunk, Session (+12 more)

### Community 15 - "Redis Cache"
Cohesion: 0.13
Nodes (14): googleAuth, googleAuthCallback, refresh(), signout(), authMiddleware(), _addKeyAndIndex(), getProductIdsByIntent(), getSetCache() (+6 more)

### Community 16 - "API Responses"
Cohesion: 0.22
Nodes (11): parseDocumentUploadHandler(), parserHealthHandler(), createResourceHandler(), getResourceHandler(), createResource(), ApiErrorPayload, ApiSuccessPayload, sendApiError() (+3 more)

### Community 17 - "Session Service"
Cohesion: 0.23
Nodes (11): appendTranscriptHandler(), endSessionHandler(), requestFinalEvaluationHandler(), requestRealtimeFeedbackHandler(), startSessionHandler(), attachResourceToSession(), appendTranscriptChunk(), createSession() (+3 more)

### Community 18 - "User Service"
Cohesion: 0.23
Nodes (10): deleteAccount(), getProfile(), updateUserProfileData(), verifyEmail(), findUserById(), findUserByVerificationToken(), toPrismaGender(), updateUserProfile() (+2 more)

### Community 19 - "Auth Utilities"
Cohesion: 0.25
Nodes (10): hashing(), verifyHash(), signin(), signup(), changePassword(), resetPassword(), Boolean, createUser() (+2 more)

### Community 20 - "Email Utilities"
Cohesion: 0.31
Nodes (7): forgotPassword(), resendVerificationEmail(), generateVerificationEmail(), generateWelcomeEmail(), sendPasswordResetEmail(), sendVerificationEmail(), sendWelcomeEmail()

### Community 21 - "Document Parser"
Cohesion: 0.22
Nodes (8): ParserAdapter, ParserErrorCode, ParserFailure, ParserHealth, ParserMetadata, ParserResult, ParserRunOptions, ParserSuccess

### Community 22 - "Python Parser"
Cohesion: 0.62
Nodes (6): _build_markitdown(), _convert_file(), _error_payload(), _health_check(), main(), _write_json()

### Community 23 - "Auth Validation"
Cohesion: 0.33
Nodes (5): passwordValidation, SigninFormSchema, SignupFormSchema, ChangePasswordSchema, updateProfileSchema

### Community 26 - "Session Validation"
Cohesion: 0.50
Nodes (3): AppendTranscriptSchema, GenerateEvaluationSchema, StartSessionSchema

### Community 27 - "Speech To Text"
Cohesion: 0.67
Nodes (3): requireWhisperKey(), transcribeAudioBuffer(), TranscriptionResult

### Community 28 - "User Types"
Cohesion: 0.50
Nodes (3): CreateUserDto, ReturnUserDto, UpdateUserProfileDto

## Knowledge Gaps
- **1031 isolated node(s):** `httpServer`, `allowedOrigins`, `io`, `server`, `app` (+1026 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `signup()` connect `Auth Utilities` to `API Responses`, `Email Utilities`, `Redis Cache`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `Boolean` connect `Auth Utilities` to `Prisma Internal Types`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `sendApiError()` connect `API Responses` to `Redis Cache`, `Session Service`, `User Service`, `Auth Utilities`, `Email Utilities`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `sendApiError()` (e.g. with `authMiddleware()` and `parseDocumentUploadHandler()`) actually correct?**
  _`sendApiError()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `sendApiSuccess()` (e.g. with `parseDocumentUploadHandler()` and `parserHealthHandler()`) actually correct?**
  _`sendApiSuccess()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `ingestResourceText()` (e.g. with `updateResourceStatus()` and `getQdrantCollection()`) actually correct?**
  _`ingestResourceText()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `signup()` (e.g. with `sendApiError()` and `findUserByEmail()`) actually correct?**
  _`signup()` has 8 INFERRED edges - model-reasoned connections that need verification._