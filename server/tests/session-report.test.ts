import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// --- Mocks (must be before any dynamic import) ----------------------------

// Mock env before app.ts is loaded — prevents "DATABASE_URL required" error
jest.unstable_mockModule('#config/env.ts', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 8000,
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'test-jwt-secret',
    REFRESH_JWT_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '5m',
    REFRESH_JWT_EXPIRES_IN: '15d',
    ENABLE_ANALYTICS: false,
    ENABLE_REALTIME_FEEDBACK: false,
    ENABLE_FINAL_EVALUATION: true,
    COOKIE_SAME_SITE: undefined,
    FRONTEND_URL: undefined,
  },
}));

// Prevent actual Redis client creation in app.ts
jest.unstable_mockModule('redis', () => ({
  default: {
    createClient: jest.fn<any>().mockReturnValue({
      connect: jest.fn<any>().mockResolvedValue(undefined),
      on: jest.fn(),
      quit: jest.fn(),
    }),
  },
  createClient: jest.fn<any>().mockReturnValue({
    connect: jest.fn<any>().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn(),
  }),
}));

jest.unstable_mockModule('#src/config/database.ts', () => ({ default: {} }));

const mockVerifyAccessToken = jest.fn<any>();

jest.unstable_mockModule('#src/utils/jwt/tokens.ts', () => ({
  verifyAccessToken: mockVerifyAccessToken,
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashTokenCrypto: jest.fn(),
  saveToCookie: jest.fn(),
  clearTokens: jest.fn(),
  createRandomToken: jest.fn(),
}));

jest.unstable_mockModule('#src/utils/redis.ts', () => ({
  getSetCache: jest
    .fn<any>()
    .mockImplementation(async (_: any, cb: any) => (cb ? cb() : null)),
  setCache: jest.fn(),
  invalidateCache: jest.fn(),
  deleteUserCache: jest.fn(),
  makeUserSessionCacheKey: (u: string, s: string) => `user-session:${u}:${s}`,
  isValidSession: jest.fn<any>().mockResolvedValue(true),
}));

const mockGetSessionById = jest.fn<any>();
const mockGetLatestFinalEvaluation = jest.fn<any>();
const mockCreateSession = jest.fn<any>();
const mockEndSession = jest.fn<any>();
const mockEnsureFinalEvaluation = jest.fn<any>();

jest.unstable_mockModule('#src/services/session.service.ts', () => ({
  getSessionById: mockGetSessionById,
  createSession: mockCreateSession,
  endSession: mockEndSession,
  appendTranscriptChunk: jest.fn(),
  getSessionTranscriptText: jest.fn(),
}));

jest.unstable_mockModule('#src/services/evaluation.service.ts', () => ({
  getLatestFinalEvaluation: mockGetLatestFinalEvaluation,
  ensureFinalEvaluation: mockEnsureFinalEvaluation,
  generateRealtimeFeedback: jest.fn(),
  generateFinalEvaluation: jest.fn(),
}));

jest.unstable_mockModule(
  '#src/services/transcript-preprocess.service.ts',
  () => ({
    preprocessTranscriptText: jest.fn<any>().mockImplementation((t: any) => t),
    preprocessTranscript: jest.fn(),
  })
);

jest.unstable_mockModule('#src/config/google.config.ts', () => ({}));

// Mock token service to avoid prisma calls from isValidSession
jest.unstable_mockModule('#src/services/token.service.ts', () => ({
  saveRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  deleteAllRefreshTokens: jest.fn(),
  deleteCurrentRefreshToken: jest.fn(),
  revokeSession: jest.fn(),
  isValidSession: jest.fn<any>().mockResolvedValue(true),
}));

// Prevent BullMQ from attempting a Redis connection during tests
jest.unstable_mockModule('#src/queues/url-ingest.queue.ts', () => ({
  urlIngestQueue: {
    add: jest.fn<any>().mockResolvedValue(undefined),
    queue: {},
    events: { on: jest.fn(), close: jest.fn() },
    close: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// --- Dynamic imports (after all mocks) ------------------------------------

const { default: app } = await import('#src/app.ts');

// --- Test data ------------------------------------------------------------

const base = '/api/sessions';
const BEARER = 'Bearer valid-token';
const USER_ID = 'user-1';
const SESSION_ID = 'sess-abc';

const mockSession = {
  id: SESSION_ID,
  userId: USER_ID,
  subject: 'physics',
  topic: 'Newton laws',
  goal: 'Understand Newton laws',
  status: 'ENDED',
  resources: [{ resourceId: 'res-1' }],
};

const mockEvaluation = {
  id: 'eval-1',
  sessionId: SESSION_ID,
  type: 'FINAL',
  content: '{"summary":"good"}',
  summary: 'Good understanding',
  strengths: ['Explained first law'],
  weaknesses: ['Missed third law'],
  missedConcepts: ['Third law'],
  followUp: ['Explain reaction pairs'],
  confidenceScore: 72,
  topicDrift: false,
};

// --- Tests ----------------------------------------------------------------

describe('GET /sessions/:sessionId/report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAccessToken.mockResolvedValue({
      userId: USER_ID,
      sessionId: 'auth-session',
    });
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get(`${base}/${SESSION_ID}/report`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when session does not exist', async () => {
    mockGetSessionById.mockResolvedValue(null);

    const res = await request(app)
      .get(`${base}/${SESSION_ID}/report`)
      .set('Authorization', BEARER);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/session not found/i);
  });

  it('returns 404 when session belongs to different user', async () => {
    mockGetSessionById.mockResolvedValue({ ...mockSession, userId: 'other' });

    const res = await request(app)
      .get(`${base}/${SESSION_ID}/report`)
      .set('Authorization', BEARER);

    expect(res.status).toBe(404);
  });

  it('returns 404 when no final evaluation exists', async () => {
    mockGetSessionById.mockResolvedValue(mockSession);
    mockGetLatestFinalEvaluation.mockResolvedValue(null);

    const res = await request(app)
      .get(`${base}/${SESSION_ID}/report`)
      .set('Authorization', BEARER);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/final evaluation not available/i);
  });

  it('returns 200 with evaluation when it exists', async () => {
    mockGetSessionById.mockResolvedValue(mockSession);
    mockGetLatestFinalEvaluation.mockResolvedValue(mockEvaluation);

    const res = await request(app)
      .get(`${base}/${SESSION_ID}/report`)
      .set('Authorization', BEARER);

    expect(res.status).toBe(200);
    expect(res.body.data.evaluation).toMatchObject({
      id: 'eval-1',
      type: 'FINAL',
      summary: 'Good understanding',
      confidenceScore: 72,
    });
  });
});

describe('POST /sessions/:sessionId/end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAccessToken.mockResolvedValue({
      userId: USER_ID,
      sessionId: 'auth-session',
    });
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post(`${base}/${SESSION_ID}/end`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    mockGetSessionById.mockResolvedValue(null);

    const res = await request(app)
      .post(`${base}/${SESSION_ID}/end`)
      .set('Authorization', BEARER);

    expect(res.status).toBe(404);
  });

  it('ends session and returns evaluation', async () => {
    mockGetSessionById.mockResolvedValue(mockSession);
    mockEndSession.mockResolvedValue({ ...mockSession, status: 'ENDED' });
    mockEnsureFinalEvaluation.mockResolvedValue(mockEvaluation);

    const res = await request(app)
      .post(`${base}/${SESSION_ID}/end`)
      .set('Authorization', BEARER);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      evaluation: expect.objectContaining({ id: 'eval-1' }),
    });
    expect(mockEndSession).toHaveBeenCalledWith(SESSION_ID);
    expect(mockEnsureFinalEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: SESSION_ID })
    );
  });
});

describe('POST /sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAccessToken.mockResolvedValue({
      userId: USER_ID,
      sessionId: 'auth-session',
    });
  });

  it('returns 400 for unsupported subject', async () => {
    mockCreateSession.mockRejectedValue(
      new Error('Unsupported subject: biology. Allowed subjects: math, physics')
    );

    const res = await request(app)
      .post(`${base}`)
      .set('Authorization', BEARER)
      .send({ subject: 'biology', topic: 'cells' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unsupported subject/i);
  });

  it('creates session for supported subject', async () => {
    mockCreateSession.mockResolvedValue(mockSession);

    const res = await request(app)
      .post(`${base}`)
      .set('Authorization', BEARER)
      .send({
        subject: 'physics',
        topic: 'Newton laws',
        goal: 'Understand laws',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.session).toMatchObject({ id: SESSION_ID });
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        subject: 'physics',
        topic: 'Newton laws',
      })
    );
  });
});
