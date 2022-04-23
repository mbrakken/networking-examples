const { createClient } = require('redis');

console.log("ENV", process.env);

const redisURL = process.env.REDIS_TLS_URL ||  process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient(redisURL);

client.on('error', (err) => console.log('Redis Client Error', err));

module.exports = client;
