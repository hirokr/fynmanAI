import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// --- Mocks ----------------------------------------------------------------

const mockPrismaEvaluationCreate = jest.fn<any>();
const mockPrismaEvaluationFindFirst = jest.fn<any>();
const mockPrismaTranscriptChunkFindMany = jest.fn<any>();

jest.unstable_mockModule('#src/config/database.ts', () => ({
  default: {
    evaluation: {
      create: mockPrismaEvaluationCreate,
      findFirst: mockPrismaEvaluationFindFirst,
    },
    transcriptChunk: {
      findMany: mockPrismaTranscriptChunkFindMany,
    },
  },
}));

const mockGenerateChatCompletion = jest.fn<any>();
const mockGenerateEmbedding = jest.fn<any>();

jest.unstable_mockModule('#src/services/ai/ai.service.ts', () => ({
  generateChatCompletion: mockGenerateChatCompletion,
  generateEmbedding: mockGenerateEmbedding,
}));

const mockRetrieveContext = jest.fn<any>();
jest.unstable_mockModule('#src/services/retrieval.service.ts', () => ({
  retrieveContext: mockRetrieveContext,
}));

const mockGetTranscriptWindowText = jest.fn<any>();
const mockShouldRunAnalysis = jest.fn<any>();
jest.unstable_mockModule('#src/services/transcript-cache.service.ts', () => ({
  getTranscriptWindowText: mockGetTranscriptWindowText,
  shouldRunAnalysis: mockShouldRunAnalysis,
}));

const mockGetSessionTranscriptText = jest.fn<any>();
jest.unstable_mockModule('#src/services/session.service.ts', () => ({
  getSessionTranscriptText: mockGetSessionTranscriptText,
  createSession: jest.fn(),
  endSession: jest.fn(),
  getSessionById: jest.fn(),
  appendTranscriptChunk: jest.fn(),
}));

const mockTrackAnalyticsEvent = jest.fn<any>();
jest.unstable_mockModule('#src/services/analytics.service.ts', () => ({
  trackAnalyticsEvent: mockTrackAnalyticsEvent,
}));

const mockAppendSessionEvent = jest.fn<any>();
jest.unstable_mockModule('#src/services/session-cache.service.ts', () => ({
  appendSessionEvent: mockAppendSessionEvent,
  setSessionMetadata: jest.fn(),
}));

jest.unstable_mockModule('#config/env.ts', () => ({
  env: {
    ENABLE_REALTIME_FEEDBACK: true,
    ENABLE_FINAL_EVALUATION: true,
    ENABLE_ANALYTICS: true,
    LLM_ANALYSIS_INTERVAL: 30,
  },
}));

// --- Tests ----------------------------------------------------------------

const {
  generateFinalEvaluation,
  getLatestFinalEvaluation,
  ensureFinalEvaluation,
} = await import('#src/services/evaluation.service.ts');

describe('generateFinalEvaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSessionTranscriptText.mockResolvedValue(
      'User explains Newton laws.'
    );
    mockRetrieveContext.mockResolvedValue([
      'Newton first law: an object at rest stays at rest.',
    ]);
    mockTrackAnalyticsEvent.mockResolvedValue(undefined);
    mockAppendSessionEvent.mockResolvedValue(undefined);
  });

  it('returns null when transcript is empty', async () => {
    mockGetSessionTranscriptText.mockResolvedValue('   ');

    const result = await generateFinalEvaluation({ sessionId: 'sess-1' });
    expect(result).toBeNull();
    expect(mockGenerateChatCompletion).not.toHaveBeenCalled();
  });

  it('creates evaluation with parsed fields when LLM returns valid JSON', async () => {
    const llmPayload = {
      summary: 'Good understanding',
      strengths: ['Explained first law correctly'],
      weaknesses: ['Missed third law'],
      missed_concepts: ['Third law'],
      follow_up: ['Explain action-reaction pairs'],
      confidence_score: 72,
      topic_drift: false,
    };

    mockGenerateChatCompletion.mockResolvedValue({
      content: JSON.stringify(llmPayload),
      provider: 'openai',
      model: 'gpt-4o',
    });

    mockPrismaEvaluationCreate.mockResolvedValue({
      id: 'eval-1',
      sessionId: 'sess-1',
      type: 'FINAL',
      content: JSON.stringify(llmPayload),
      summary: llmPayload.summary,
      strengths: llmPayload.strengths,
      weaknesses: llmPayload.weaknesses,
      missedConcepts: llmPayload.missed_concepts,
      followUp: llmPayload.follow_up,
      confidenceScore: 72,
      topicDrift: false,
    });

    const result = await generateFinalEvaluation({
      sessionId: 'sess-1',
      subject: 'physics',
      topic: 'Newton laws',
    });

    expect(result).toBeTruthy();
    expect(mockPrismaEvaluationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'FINAL',
          summary: 'Good understanding',
          confidenceScore: 72,
          topicDrift: false,
        }),
      })
    );
  });

  it('clamps confidence_score above 100 to 100', async () => {
    const llmPayload = {
      summary: 'Perfect',
      strengths: [],
      weaknesses: [],
      missed_concepts: [],
      follow_up: [],
      confidence_score: 150,
      topic_drift: false,
    };

    mockGenerateChatCompletion.mockResolvedValue({
      content: JSON.stringify(llmPayload),
      provider: 'openai',
      model: 'gpt-4o',
    });
    mockPrismaEvaluationCreate.mockResolvedValue({
      id: 'eval-2',
      confidenceScore: 100,
    });

    await generateFinalEvaluation({ sessionId: 'sess-1' });

    expect(mockPrismaEvaluationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ confidenceScore: 100 }),
      })
    );
  });

  it('clamps confidence_score below 0 to 0', async () => {
    const llmPayload = {
      summary: 'Terrible',
      strengths: [],
      weaknesses: [],
      missed_concepts: [],
      follow_up: [],
      confidence_score: -20,
      topic_drift: false,
    };

    mockGenerateChatCompletion.mockResolvedValue({
      content: JSON.stringify(llmPayload),
      provider: 'openai',
      model: 'gpt-4o',
    });
    mockPrismaEvaluationCreate.mockResolvedValue({
      id: 'eval-3',
      confidenceScore: 0,
    });

    await generateFinalEvaluation({ sessionId: 'sess-1' });

    expect(mockPrismaEvaluationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ confidenceScore: 0 }),
      })
    );
  });

  it('stores null confidenceScore when LLM returns unparseable JSON', async () => {
    mockGenerateChatCompletion.mockResolvedValue({
      content: 'Here is some unstructured text with no JSON.',
      provider: 'openai',
      model: 'gpt-4o',
    });
    mockPrismaEvaluationCreate.mockResolvedValue({ id: 'eval-4' });

    await generateFinalEvaluation({ sessionId: 'sess-1' });

    expect(mockPrismaEvaluationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ confidenceScore: null }),
      })
    );
  });

  it('tracks analytics events on completion', async () => {
    mockGenerateChatCompletion.mockResolvedValue({
      content:
        '{"summary":"ok","strengths":[],"weaknesses":[],"missed_concepts":[],"follow_up":[],"confidence_score":60,"topic_drift":false}',
      provider: 'openai',
      model: 'gpt-4o',
    });
    mockPrismaEvaluationCreate.mockResolvedValue({ id: 'eval-5' });

    await generateFinalEvaluation({ sessionId: 'sess-1' });

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'evaluation.final' })
    );
  });
});

describe('getLatestFinalEvaluation', () => {
  it('returns the latest FINAL evaluation for a session', async () => {
    const evaluation = { id: 'eval-1', type: 'FINAL', sessionId: 'sess-1' };
    mockPrismaEvaluationFindFirst.mockResolvedValue(evaluation);

    const result = await getLatestFinalEvaluation('sess-1');
    expect(result).toEqual(evaluation);
    expect(mockPrismaEvaluationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: 'sess-1', type: 'FINAL' },
      })
    );
  });

  it('returns null when no final evaluation exists', async () => {
    mockPrismaEvaluationFindFirst.mockResolvedValue(null);

    const result = await getLatestFinalEvaluation('sess-empty');
    expect(result).toBeNull();
  });
});

describe('ensureFinalEvaluation', () => {
  it('returns existing evaluation without generating a new one', async () => {
    const existing = { id: 'eval-existing', type: 'FINAL' };
    mockPrismaEvaluationFindFirst.mockResolvedValue(existing);

    const result = await ensureFinalEvaluation({ sessionId: 'sess-1' });
    expect(result).toEqual(existing);
    expect(mockGenerateChatCompletion).not.toHaveBeenCalled();
  });

  it('generates evaluation when none exists', async () => {
    mockPrismaEvaluationFindFirst.mockResolvedValue(null);
    mockGetSessionTranscriptText.mockResolvedValue('Some content');
    mockRetrieveContext.mockResolvedValue([]);
    mockGenerateChatCompletion.mockResolvedValue({
      content:
        '{"summary":"ok","strengths":[],"weaknesses":[],"missed_concepts":[],"follow_up":[],"confidence_score":50,"topic_drift":false}',
      provider: 'openai',
      model: 'gpt-4o',
    });
    mockPrismaEvaluationCreate.mockResolvedValue({
      id: 'eval-new',
      type: 'FINAL',
    });

    const result = await ensureFinalEvaluation({ sessionId: 'sess-1' });
    expect(result).toBeTruthy();
    expect(mockGenerateChatCompletion).toHaveBeenCalledTimes(1);
  });
});
