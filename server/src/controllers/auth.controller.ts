import { Request, Response } from 'express';
import passport from 'passport';
import '../config/google.config.ts';
import {
  createUser,
  findUserByEmail,
  updateUserPassword,
} from '#src/services/user.service.ts';

import {
  clearTokens,
  createRandomToken,
  generateTokens,
  hashTokenCrypto,
  saveToCookie,
  verifyRefreshToken,
} from '#src/utils/jwt/tokens.ts';
import {
  deleteAllRefreshTokens,
  deleteCurrentRefreshToken,
  findRefreshToken,
  revokeSession,
  saveRefreshToken,
} from '#src/services/token.service.ts';
import { hashing, verifyHash } from '#src/utils/auth/hash.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import {
  invalidateCache,
  makeUserSessionCacheKey,
  setCache,
} from '#src/utils/redis.ts';
import z from 'zod';
import { ReturnUserDto } from '#src/types/user.js';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from '#src/utils/mail/sendMail.ts';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';

// TODO: Fix The Refresh Token Race Condition
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const { ip, 'user-agent': userAgent } = req.headers;

  // Validate refresh token
  if (!refreshToken) {
    return sendApiError(res, { status: 401, message: 'Refresh token missing' });
  }

  // Checking the refreshes token validity from the token itself
  const userId: string | null = await verifyRefreshToken(refreshToken);
  if (!userId) {
    return sendApiError(res, { status: 401, message: 'Invalid refresh token' });
  }

  // Check if refresh token exists in DB and is active
  const hashRT = hashTokenCrypto(refreshToken);
  const storedToken = await findRefreshToken(hashRT);

  if (!storedToken) {
    return sendApiError(res, { status: 401, message: 'Invalid Refresh Token' });
  }

  // Revoking old refresh token and session
  await revokeSession(userId, storedToken.sessionId);
  await invalidateCache(
    makeUserSessionCacheKey(userId, storedToken.sessionId),
    userId
  );

  // Generate new tokens and save to DB and cookies
  const newSessionId = createRandomToken();
  const newCacheKey = makeUserSessionCacheKey(userId, newSessionId);
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    userId,
    newSessionId
  );
  await setCache(newCacheKey, userId, newRefreshToken);

  const hashedRefreshToken = hashTokenCrypto(newRefreshToken);
  await saveRefreshToken(
    userId,
    hashedRefreshToken,
    newSessionId,
    userAgent,
    ip as string
  );

  await saveToCookie(res, newRefreshToken, accessToken);
  sendApiSuccess(res, { message: 'Token refreshed' });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return sendApiError(res, {
        status: 400,
        message: 'Email, password and name are required',
      });
    }

    const user = await findUserByEmail(email);
    if (user) {
      const hasPassword = Boolean(user.passwordHash?.trim());

      if (hasPassword) {
        return sendApiError(res, {
          status: 400,
          message: 'User already exists',
        });
      }

      const hashedPassword = await hashing(password);
      await updateUserPassword(user.id, hashedPassword);

      sendApiSuccess(res, {
        message: 'Account linked successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatarUrl || undefined,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            userBodyImageUrl: user.userBodyImageUrl || undefined,
            age: user.age || undefined,
          },
        },
      });

      return;
    }

    const hashedPassword = await hashing(password);
    const verificationToken = createRandomToken();

    const newUser: ReturnUserDto = await createUser({
      ...req.body,
      passwordHash: hashedPassword,
      verificationToken,
    });

    // TODO: Test
    sendVerificationEmail({
      to: newUser.email,
      userName: newUser.name,
      verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`,
      expiryMinutes: 1440, // 24 hours
    }).catch(err =>
      console.error('Verification email failed (non-fatal):', err)
    );

    sendApiSuccess(res, {
      status: 201,
      message: 'User registered successfully',
      data: { user: newUser },
    });
  } catch (error) {
    // console.error('Error in signup:', error);
    sendApiError(res, { status: 500, message: 'user creation failed' });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { ip, 'user-agent': userAgent } = req.headers;
  if (!email || !password) {
    return sendApiError(res, {
      status: 400,
      message: 'Email and password are required',
    });
  }

  const user = await findUserByEmail(email);

  // Normalize response to avoid user enumeration (don't reveal whether email exists)
  if (!user) {
    return sendApiError(res, {
      status: 400,
      message: 'Invalid email or password',
    });
  }

  const isPasswordValid = await verifyHash(
    user.passwordHash as string,
    password
  );
  if (!isPasswordValid) {
    return sendApiError(res, {
      status: 400,
      message: 'Invalid email or password',
    });
  }

  const sessionId = createRandomToken();

  const { accessToken, refreshToken } = await generateTokens(
    user.id,
    sessionId
  );
  const hashedRefreshToken = hashTokenCrypto(refreshToken);

  await saveRefreshToken(
    user.id,
    hashedRefreshToken,
    sessionId,
    userAgent,
    ip as string
  );

  await saveToCookie(res, refreshToken, accessToken);

  const secureUser: ReturnUserDto = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatarUrl || undefined,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    userBodyImageUrl: user.userBodyImageUrl || undefined,
    age: user.age || undefined,
  };

  sendApiSuccess(res, {
    message: 'Signin successful',
    data: {
      user: secureUser,
      accessToken,
      refreshToken,
    },
  });
};

// @desc    Signout user and invalidate refresh token
// @route   GET /auth/signout
export const signout = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return sendApiError(res, {
      status: 401,
      message: 'User not authenticated',
    });
  }
  const { userId, sessionId } = req;

  // Invalidate session and cache
  if (sessionId) {
    await deleteCurrentRefreshToken(sessionId || '');
    await revokeSession(userId, sessionId);
    await invalidateCache(makeUserSessionCacheKey(userId, sessionId), userId);
  } else {
    // delete all refresh tokens for the user if no sessionId is found (edge case)
    await deleteAllRefreshTokens(userId);
  }

  // Clear cookies
  await clearTokens(res);

  req.logout(err => {
    if (err)
      return sendApiError(res, { status: 500, message: 'Signout failed' });
    req.session.destroy(err => {
      if (err) {
        return sendApiError(res, { status: 500, message: 'Signout failed' });
      }

      sendApiSuccess(res, { message: 'Signout success' });
    });
  });
};

// @desc    Initiate Google OAuth2 login
// @route   GET /auth/google
export const googleAuth = passport.authenticate('google', {
  scope: ['email', 'profile'],
});

// @desc    Handle Google OAuth2 callback
// @route   GET /api/auth/google/callback
export const googleAuthCallback = [
  passport.authenticate('google', {
    session: false, // important if you're using JWT instead of sessions
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/failure`,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as ReturnUserDto;
      const { ip, 'user-agent': userAgent } = req.headers;

      if (!user) {
        return sendApiError(res, {
          status: 401,
          message: 'Authentication failed',
        });
      }

      const newSessionId = createRandomToken();
      const { accessToken, refreshToken } = await generateTokens(
        user.id,
        newSessionId
      );

      const hashedRefreshToken = hashTokenCrypto(refreshToken);
      await saveRefreshToken(
        user.id,
        hashedRefreshToken,
        newSessionId,
        userAgent,
        ip as string
      );

      // saving to cache for quick session validation
      await setCache(
        makeUserSessionCacheKey(user.id, newSessionId),
        user.id,
        refreshToken
      );

      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

      const existingUser = await findUserByEmail(user.email);

      if (!existingUser) {
        return res.redirect(
          `${frontend}/api/auth/google/callback?id=${user.id}&email=${user.email}&name=${user.name}&avatar=${user.avatar || ''}&emailVerified=${user.emailVerified}&isActive=${user.isActive}&accessToken=${accessToken}&refreshToken=${refreshToken}&userBodyImageUrl=${user.userBodyImageUrl || ''}&age=${user.age || ''}`
        );
      }

      // sendWelcomeEmail({
      //   to: user.email,
      //   userName: user.name,
      //   dashboardLink: `${frontend}`, //TODO: add dashboard link
      // });

      return res.redirect(
        `${frontend}/api/auth/google/callback?id=${user.id}&email=${user.email}&name=${user.name}&avatar=${user.avatar || ''}&emailVerified=${user.emailVerified}&isActive=${user.isActive}&accessToken=${accessToken}&refreshToken=${refreshToken}&userBodyImageUrl=${user.userBodyImageUrl || ''}&age=${user.age || ''}`
      );
    } catch (error) {
      console.error('Error in Google auth callback:', error);
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontend}/auth/failure`);
    }
  },
];

// @desc    Google OAuth2 failure route
// @route   GET /auth/google/failure
// todo: keep one failure route
export const googleAuthFailure = async (req: Request, res: Response) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontend}/auth/failure`);
};
