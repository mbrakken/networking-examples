const { createClient } = require('redis');

console.log('ENV', process.env);

const redisURL =
  process.env.REDIS_TLS_URL ||
  process.env.REDIS_URL ||
  process.env.REDISTOGO_URL;

console.log('redisURL', redisURL);

const client = createClient(redisURL);

client.on('error', (err) => console.log('Redis Client Error', err));

module.exports = client;
