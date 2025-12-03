const { v4: uuidv4 } = require('uuid');
const { redis } = require('./redisClient');

const DEFAULT_LOCK_TTL_MS = 5000;

async function acquireLock(key, ttlMs = DEFAULT_LOCK_TTL_MS, timeoutMs = 2000) {
  const lockId = uuidv4();
  const end = Date.now() + timeoutMs;

  while (Date.now() < end) {
    // SET key value NX PX ttl
    // eslint-disable-next-line no-await-in-loop
    const result = await redis.set(key, lockId, 'NX', 'PX', ttlMs);
    if (result === 'OK') {
      return { key, value: lockId };
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw Object.assign(new Error('Failed to acquire lock'), { status: 503 });
}

async function releaseLock({ key, value }) {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  await redis.eval(script, 1, key, value);
}

module.exports = {
  acquireLock,
  releaseLock,
};


