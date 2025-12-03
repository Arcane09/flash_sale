const Redis = require('ioredis');
const { REDIS_URL } = require('../config/config');

const redis = new Redis(REDIS_URL);

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis error', err);
});

module.exports = { redis };
