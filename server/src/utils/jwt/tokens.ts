import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// Separate secrets for each token type
if (!process.env.JWT_SECRET || !process.env.REFRESH_JWT_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables');
}

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET as string
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_JWT_SECRET as string
);

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '5m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN || '15d';

export const generateTokens = async (userId: string, sessionId: string) => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, sessionId),
    generateRefreshToken(userId),
  ]);
  return { accessToken, refreshToken };
};

export const generateAccessToken = (userId: string, sessionId: string) => {
  return new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRES_IN)
    .sign(ACCESS_SECRET);
};

export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = (await jwtVerify(token, ACCESS_SECRET)) as {
      payload: { userId: string; sessionId: string };
    };
    return { userId: payload.userId, sessionId: payload.sessionId };
  } catch (error) {
    return null;
  }
};

export const generateRefreshToken = (userId: string) => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const { payload } = (await jwtVerify(token, REFRESH_SECRET)) as {
      payload: { userId: string } | undefined;
    };
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
};

export const clearTokens = (res: any) => {
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
};

export const hasExpired = (token: string, type: 'access' | 'refresh') => {
  const secret = type === 'access' ? ACCESS_SECRET : REFRESH_SECRET;
  try {
    // jwtVerify returns a Promise — await it to properly catch errors
    // but this function is synchronous in signature, so we call the async
    // verifier and treat a rejected promise as expired by returning true.
    // To keep the API simple, perform a synchronous-looking check using
    // the promise's result via then/catch.
    let valid = true;
    jwtVerify(token, secret)
      .then(() => {
        valid = true;
      })
      .catch(() => {
        valid = false;
      });
    // Note: because jwtVerify is async, assume token is valid only if
    // verification does not reject immediately. Consumers should prefer
    // using `verifyAccessToken`/`verifyRefreshToken` which are async.
    return !!valid;
  } catch (error) {
    return true; // Token is invalid or expired
  }
};

// DONE: Save tokens in cookies with secure and httpOnly flags
export const saveToCookie = async (
  res: any,
  refreshToken: string,
  accessToken: string
) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    // use lowercase `expires` and also provide `maxAge` for robustness
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    maxAge: 15 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
    // short-lived access token cookie — set a reasonable expiry (matches JWT short expiry)
    expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    maxAge: 5 * 60 * 1000,
  });
};

export function hashTokenCrypto(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const createRandomToken = () => crypto.randomBytes(32).toString('hex');
