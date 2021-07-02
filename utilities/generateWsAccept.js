const crypto = require('crypto');

const WS_TOKEN = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

module.exports = function generateWsAccept(wsKey) {
  return crypto
    .createHash('sha1')
    .update(wsKey + WS_TOKEN, 'binary')
    .digest('base64');
};
