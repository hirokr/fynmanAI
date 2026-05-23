import { redisClient } from '#src/app.ts';

let DEFAULT_EXPIRATION =
  Number(process.env.REDIS_DEFAULT_EXPIRATION) || 15 * 60 * 60 * 24;

const PRODUCT_INTENT_CACHE_PREFIX = 'product-intent';
const PRODUCT_INTENT_EXPIRATION =
  Number(process.env.REDIS_PRODUCT_INTENT_EXPIRATION) || DEFAULT_EXPIRATION;

// ! Gpt experimental function, not used anywhere yet
export const getSetRedis = (key: string, cb: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      redisClient.on('error', err => console.log('Redis Client Error', err));
      await redisClient.connect();

      const data = await redisClient.get(key);
      if (data) {
        await redisClient.quit();
        const raw = typeof data === 'string' ? data : data.toString();
        return resolve(JSON.parse(raw));
      }

      const freshData = await cb();
      await redisClient.set(key, JSON.stringify(freshData), {
        EX: 60 * 60 * 24,
      });
      await redisClient.quit();
      resolve(freshData);
    } catch (error) {
      reject(error);
    }
  });
};

const parseUserIdFromSessionCacheKey = (key: string): string | null => {
  const [prefix, userId] = key.split(':');
  if (prefix !== 'user-session' || !userId) {
    return null;
  }

  return userId;
};

const makeProductIntentCacheKey = (intentKey: string): string =>
  `${PRODUCT_INTENT_CACHE_PREFIX}:${intentKey}`;

// DONE: Create a utility function to get and set cache with expiration
export const getSetCache = async <T>(
  key: string,
  cb: () => Promise<T>
): Promise<T | null> => {
  const data = await redisClient.get(key);

  if (data !== null) {
    const raw = typeof data === 'string' ? data : data.toString();
    return JSON.parse(raw);
  }

  const freshData = await cb();
  if (freshData === null || freshData === undefined) {
    return null;
  }

  const userId = parseUserIdFromSessionCacheKey(key);
  if (userId) {
    await _addKeyAndIndex(key, userId, freshData);
  } else {
    await redisClient.set(key, JSON.stringify(freshData), {
      EX: DEFAULT_EXPIRATION,
    });
  }

  return freshData;
};

// DONE: invalidate cache by key
export const invalidateCache = async (
  key: string,
  userId: string
): Promise<void> => {
  const indexKey = `user-session-index:${userId}`;
  await redisClient.sRem(indexKey, key);
  await redisClient.del(key);
};

// DONE: Create a utility function to get cache without setting it
export const getCache = async (key: string): Promise<any> => {
  const data = await redisClient.get(key);
  if (!data) return null;
  const raw = typeof data === 'string' ? data : data.toString();
  return JSON.parse(raw);
};

// DONE: Create a utility function to set cache with expiration
export const setCache = async (
  key: string,
  userId: string,
  value: any,
  expiration?: number
) => {
  await _addKeyAndIndex(key, userId, value, expiration);
};

export const getProductIdsByIntent = async (
  intentKey: string
): Promise<string[] | null> => {
  const key = makeProductIntentCacheKey(intentKey);
  const data = await redisClient.get(key);

  if (!data) {
    return null;
  }

  try {
    const raw = typeof data === 'string' ? data : data.toString();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const productIds = parsed.filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );

    return productIds.length > 0 ? productIds : null;
  } catch {
    return null;
  }
};

export const setProductIdsByIntent = async (
  intentKey: string,
  productIds: string[]
): Promise<void> => {
  const normalizedProductIds = Array.from(
    new Set(
      productIds.filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0
      )
    )
  );

  if (!normalizedProductIds.length) {
    return;
  }

  const key = makeProductIntentCacheKey(intentKey);
  await redisClient.set(key, JSON.stringify(normalizedProductIds), {
    EX: PRODUCT_INTENT_EXPIRATION,
  });
};

// DONE: Create a utility function to generate cache key for user sessions
export const makeUserSessionCacheKey = (userId: string, sessionId: string) =>
  `user-session:${userId}:${sessionId}`;

// DONE: create a utility function to delete all cache related to a user (e.g., on account deletion)
export const deleteUserCache = async (userId: string): Promise<void> => {
  const indexKey = `user-session-index:${userId}`;
  const sessionKeys = await redisClient.sMembers(indexKey);

  // ensure sessionKeys is an array
  const keysArray = Array.isArray(sessionKeys)
    ? sessionKeys
    : Array.from(sessionKeys as Set<string>);

  if (keysArray.length > 0) {
    // Delete keys individually to avoid typing issues with spread arguments
    for (const k of keysArray) {
      await redisClient.del(k);
    }
  }
  await redisClient.del(indexKey);
};

// DONE: Create a helper function to add cache key to user's session index
const _addKeyAndIndex = async (
  key: string,
  userId: string,
  value: any,
  expiration?: number
) => {
  const exp = expiration || DEFAULT_EXPIRATION;
  await redisClient.set(key, JSON.stringify(value), {
    EX: exp,
  });
  await redisClient.sAdd(`user-session-index:${userId}`, key);
};
