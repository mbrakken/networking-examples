const redis = require('redis');

const redisURL = process.env.REDISTOGO_URL || "redis://localhost:6379"

const client = redis.createClient();

module.exports = client;
