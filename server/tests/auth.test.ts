import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// 1. We cast mocks to <any> to prevent "Argument of type X is not assignable to parameter of type never" errors.
const mockFindUserByEmail = jest.fn<any>();
const mockCreateUser = jest.fn<any>();
const mockUpdateUserPassword = jest.fn<any>();
const mockVerifyHash = jest.fn<any>();
const mockHashing = jest.fn<any>();

const mockGenerateTokens = jest.fn<any>();
const mockVerifyRefreshToken = jest.fn<any>();
const mockVerifyAccessToken = jest.fn<any>();
const mockHashTokenCrypto = jest.fn<any>();
const mockSaveToCookie = jest.fn<any>();
const mockClearTokens = jest.fn<any>();
const mockCreateRandomToken = jest.fn<any>();
const mockSendVerificationEmail = jest.fn<any>();
const mockSendWelcomeEmail = jest.fn<any>();
const mockSendPasswordResetEmail = jest.fn<any>();

const mockSaveRefreshToken = jest.fn<any>();
const mockFindRefreshToken = jest.fn<any>();
const mockDeleteAllRefreshTokens = jest.fn<any>();
const mockDeleteCurrentRefreshToken = jest.fn<any>();
const mockRevokeSession = jest.fn<any>();
const mockIsValidSession = jest.fn<any>();

const mockGetSetCache = jest.fn<any>();
const mockSetCache = jest.fn<any>();
const mockInvalidateCache = jest.fn<any>();

// 2. Mock Modules
jest.unstable_mockModule('#src/config/google.config.ts', () => ({}));

jest.unstable_mockModule('#src/services/user.service.ts', () => ({
  findUserByEmail: mockFindUserByEmail,
  createUser: mockCreateUser,
  updateUserPassword: mockUpdateUserPassword,
  findUserById: jest.fn(),
  findUserByVerificationToken: jest.fn(),
  updateUserProfile: jest.fn(),
  verifyUserEmail: jest.fn(),
}));

jest.unstable_mockModule('#src/utils/auth/hash.ts', () => ({
  verifyHash: mockVerifyHash,
  hashing: mockHashing,
}));

jest.unstable_mockModule('#src/utils/jwt/tokens.ts', () => ({
  generateTokens: mockGenerateTokens,
  verifyRefreshToken: mockVerifyRefreshToken,
  verifyAccessToken: mockVerifyAccessToken,
  hashTokenCrypto: mockHashTokenCrypto,
  saveToCookie: mockSaveToCookie,
  clearTokens: mockClearTokens,
  createRandomToken: mockCreateRandomToken,
}));

jest.unstable_mockModule('#src/utils/mail/sendMail.ts', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

jest.unstable_mockModule('#src/services/token.service.ts', () => ({
  saveRefreshToken: mockSaveRefreshToken,
  findRefreshToken: mockFindRefreshToken,
  deleteAllRefreshTokens: mockDeleteAllRefreshTokens,
  deleteCurrentRefreshToken: mockDeleteCurrentRefreshToken,
  revokeSession: mockRevokeSession,
  isValidSession: mockIsValidSession,
}));

jest.unstable_mockModule('#src/utils/redis.ts', () => ({
  getSetCache: mockGetSetCache,
  setCache: mockSetCache,
  invalidateCache: mockInvalidateCache,
  deleteUserCache: jest.fn(),
  makeUserSessionCacheKey: (userId: string, sessionId: string) =>
    `user-session:${userId}:${sessionId}`,
}));

jest.unstable_mockModule('passport', () => ({
  default: {
    initialize: () => (req: any, _res: any, next: any) => {
      req.logout = (cb: any) => cb();
      next();
    },
    session: () => (req: any, _res: any, next: any) => {
      req.logout = (cb: any) => cb();
      next();
    },
    authenticate: () => (req: any, _res: any, next: any) => next(),
  },
}));

// 3. Dynamic import of the app
const { default: app } = await import('#src/app.ts');
const authBase = '/api/auth';

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default implementation for cache wrapper
    mockGetSetCache.mockImplementation(async (_key: string, cb: any) => {
      return cb ? await cb() : null;
    });
    mockSendVerificationEmail.mockResolvedValue(undefined);
    mockSendWelcomeEmail.mockResolvedValue(undefined);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
  });

  describe('POST /auth/signup', () => {
    it('returns 400 when required fields are missing', async () => {
      const response = await request(app).post(`${authBase}/signup`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/required|invalid/i);
    });

    it('returns 400 when name is too short', async () => {
      const response = await request(app)
        .post(`${authBase}/signup`)
        .send({ email: 'test@example.com', password: 'Password1!', name: 'A' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Name must be at least 2 characters long.'
      );
    });

    it('returns 400 when password is too weak', async () => {
      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'weak',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/at least 8 characters/i);
    });

    it('returns 400 when password lacks special character', async () => {
      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'Password1',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/special character/i);
    });

    it('returns 400 when password lacks number', async () => {
      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'Password!',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/number/i);
    });

    it('returns 400 when email is invalid', async () => {
      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'not-an-email',
        password: 'Password1!',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/valid email/i);
    });

    it('returns 400 when user already exists', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'hashed-pass',
      });

      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });

    it('creates a new user on success', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashing.mockResolvedValue('hashed-pass');
      mockCreateUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        emailVerified: false,
        isActive: false,
      });

      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'John Doe',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        'message',
        'User registered successfully'
      );
      expect(mockHashing).toHaveBeenCalledWith('Password1!');
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'John Doe',
          passwordHash: 'hashed-pass',
        })
      );
    });

    it('links a password to an existing google account', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        passwordHash: ' ',
        emailVerified: true,
        isActive: true,
      });
      mockHashing.mockResolvedValue('linked-hashed-pass');
      mockUpdateUserPassword.mockResolvedValue(undefined);

      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'John Doe',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Account linked successfully'
      );
      expect(mockUpdateUserPassword).toHaveBeenCalledWith(
        'user-1',
        'linked-hashed-pass'
      );
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('returns 500 when user creation fails', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashing.mockResolvedValue('hashed-pass');
      mockCreateUser.mockRejectedValue(new Error('db down'));

      const response = await request(app).post(`${authBase}/signup`).send({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'John Doe',
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'user creation failed');
    });
  });

  describe('POST /auth/signin', () => {
    it('returns 400 when password is too short', async () => {
      const response = await request(app)
        .post(`${authBase}/signin`)
        .send({ email: 'test@example.com', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/at least 8 characters/i);
    });

    it('returns 400 when email is invalid', async () => {
      const response = await request(app)
        .post(`${authBase}/signin`)
        .send({ email: 'not-an-email', password: 'Password1!' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/valid email/i);
    });

    it('returns 400 when email is not found', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post(`${authBase}/signin`)
        .send({ email: 'test@example.com', password: 'Password1!' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid email or password'
      );
    });

    it('returns 400 when password is invalid', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        passwordHash: 'hashed-pass',
        emailVerified: false,
        isActive: true,
      });
      mockVerifyHash.mockResolvedValue(false);

      const response = await request(app)
        .post(`${authBase}/signin`)
        .send({ email: 'test@example.com', password: 'WrongPass1!' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid email or password'
      );
    });

    it('returns user and sets tokens on success', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        passwordHash: 'hashed-pass',
        emailVerified: true,
        isActive: true,
      });
      mockVerifyHash.mockResolvedValue(true);
      mockCreateRandomToken.mockReturnValue('session-1');
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      });
      mockHashTokenCrypto.mockReturnValue('hashed-refresh');
      mockSaveRefreshToken.mockResolvedValue(undefined);

      const response = await request(app)
        .post(`${authBase}/signin`)
        .send({ email: 'test@example.com', password: 'Password1!' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Signin successful');
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data).toMatchObject({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      });

      // FIXED: We now accept undefined for the last two arguments (IP and UserAgent)
      expect(mockSaveRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'hashed-refresh',
        'session-1',
        undefined,
        undefined
      );

      expect(mockSaveToCookie).toHaveBeenCalledWith(
        expect.anything(),
        'refresh-1',
        'access-1'
      );
    });

    it('does not leak password hash in response', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        passwordHash: 'hashed-pass',
        emailVerified: true,
        isActive: true,
      });
      mockVerifyHash.mockResolvedValue(true);
      mockCreateRandomToken.mockReturnValue('session-1');
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      });
      mockHashTokenCrypto.mockReturnValue('hashed-refresh');

      const response = await request(app)
        .post(`${authBase}/signin`)
        .send({ email: 'test@example.com', password: 'Password1!' });

      expect(response.body.data.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        emailVerified: true,
        isActive: true,
      });
    });
  });

  describe('GET /auth/refresh', () => {
    it('returns 401 when refresh token cookie is missing', async () => {
      const response = await request(app).get(`${authBase}/refresh`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Refresh token missing');
    });

    it('returns 401 for invalid refresh token', async () => {
      mockVerifyRefreshToken.mockResolvedValue(null);

      const response = await request(app)
        .get(`${authBase}/refresh`)
        .set('Cookie', 'refreshToken=bad');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });

    it('returns 401 when refresh token is not stored', async () => {
      mockVerifyRefreshToken.mockResolvedValue('user-1');
      mockHashTokenCrypto.mockReturnValue('hashed-refresh');
      mockFindRefreshToken.mockResolvedValue(null);

      const response = await request(app)
        .get(`${authBase}/refresh`)
        .set('Cookie', 'refreshToken=valid');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid Refresh Token');
    });

    it('rotates tokens and returns 200 on success', async () => {
      mockVerifyRefreshToken.mockResolvedValue('user-1');
      mockHashTokenCrypto.mockReturnValue('hashed-refresh');
      mockFindRefreshToken.mockResolvedValue({ sessionId: 'old-session' });
      mockCreateRandomToken.mockReturnValue('new-session');
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      });
      mockSetCache.mockResolvedValue(undefined);
      mockSaveRefreshToken.mockResolvedValue(undefined);
      mockRevokeSession.mockResolvedValue(undefined);
      // mockInvalidateCache.mockResolvedValue(undefined);

      const response = await request(app)
        .get(`${authBase}/refresh`)
        .set('Cookie', 'refreshToken=valid');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Token refreshed');
      expect(mockRevokeSession).toHaveBeenCalledWith('user-1', 'old-session');
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        'user-session:user-1:old-session',
        'user-1'
      );
      expect(mockSaveToCookie).toHaveBeenCalledWith(
        expect.anything(),
        'refresh-2',
        'access-2'
      );
    });

    it('revokes old session when rotating tokens', async () => {
      mockVerifyRefreshToken.mockResolvedValue('user-1');
      mockHashTokenCrypto.mockReturnValue('hashed-refresh');
      mockFindRefreshToken.mockResolvedValue({ sessionId: 'old-session' });
      mockCreateRandomToken.mockReturnValue('new-session');
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      });

      await request(app)
        .get(`${authBase}/refresh`)
        .set('Cookie', 'refreshToken=valid');

      expect(mockRevokeSession).toHaveBeenCalledWith('user-1', 'old-session');
      expect(mockDeleteCurrentRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('GET /auth/signout', () => {
    it('returns 401 when missing auth header', async () => {
      const response = await request(app).get(`${authBase}/signout`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 401 when auth header is malformed', async () => {
      const response = await request(app)
        .get(`${authBase}/signout`)
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 401 when token is invalid', async () => {
      mockVerifyAccessToken.mockResolvedValue(null);

      const response = await request(app)
        .get(`${authBase}/signout`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('clears tokens and revokes session on success', async () => {
      mockVerifyAccessToken.mockResolvedValue({
        userId: 'user-1',
        sessionId: 'session-1',
      });
      mockIsValidSession.mockResolvedValue(true);
      mockDeleteCurrentRefreshToken.mockResolvedValue(undefined);
      mockRevokeSession.mockResolvedValue(undefined);
      mockInvalidateCache.mockResolvedValue(undefined);
      mockClearTokens.mockResolvedValue(undefined);

      const response = await request(app)
        .get(`${authBase}/signout`)
        .set('Authorization', 'Bearer access-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Signout success');
      expect(mockDeleteCurrentRefreshToken).toHaveBeenCalledWith('session-1');
      expect(mockRevokeSession).toHaveBeenCalledWith('user-1', 'session-1');
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        'user-session:user-1:session-1',
        'user-1'
      );
      expect(mockClearTokens).toHaveBeenCalled();
    });

    it('invalidates cache on signout', async () => {
      mockVerifyAccessToken.mockResolvedValue({
        userId: 'user-1',
        sessionId: 'session-1',
      });
      mockIsValidSession.mockResolvedValue(true);

      await request(app)
        .get(`${authBase}/signout`)
        .set('Authorization', 'Bearer access-1');

      expect(mockInvalidateCache).toHaveBeenCalledWith(
        'user-session:user-1:session-1',
        'user-1'
      );
    });
  });
});
