const { createClient } = require('redis');

const redisURL = process.env.REDISTOGO_URL || "redis://localhost:6379"
const client = createClient(redisURL);

module.exports = client;
