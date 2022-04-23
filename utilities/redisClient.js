const { createClient } = require('redis');

const redisURL =
  process.env.REDIS_TLS_URL ||
  process.env.REDIS_URL ||
  'redis://localhost:6379';

const redisConfig = {
  url: redisURL,
};

if (/^rediss:/.test(redisURL)) {
  redisConfig.socket = {
    tls: true,
    rejectUnauthorized: false,
  };
}

const client = createClient(redisConfig);

client.on('error', (err) => console.log('Redis Client Error', err));

module.exports = client;
