const generateWsAccept = require('./generateWsAccept');
const {
  parseIncomingMessage,
  processFirstByte,
  sendControlMessage,
  writeOutgoingMessage,
} = require('./webSocket');

module.exports = function websocketListener(request, socket, head) {
  if (request.headers['upgrade'] !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request');
    return;
  }

  const acceptKey = generateWsAccept(request.headers['sec-websocket-key']);

  socket.write(
    'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
      'Upgrade: WebSocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
      '\r\n'
  );

  console.log('SOCKET INFO');
  console.log('address:', socket.address());
  console.log('localAddress', socket.localAddress);
  console.log('localPort', socket.localPort);
  console.log('remoteAddress', socket.remoteAddress);
  console.log('remoteFamily', socket.remoteFamily);
  console.log('remotePort', socket.remotePort);

  // socket.pipe(socket); // echo back

  socket.on('data', (buffer) => {
    if (buffer) {
      const firstByte = processFirstByte(buffer);
      if (firstByte.opcode > 0x7) {
        sendControlMessage(socket, buffer, firstByte);
      } else {
        const data = parseIncomingMessage(buffer, firstByte);

        console.log('message:', buffer.toJSON(), data);
        socket.write(writeOutgoingMessage(`You sent: "${data}"`));
      }
    } else if (buffer === null) {
      console.log('WebSocket connection closed by the client.');
    }
  });

  socket.on('error', (err) => {
    console.warn('Socket error', err);
  });
};
