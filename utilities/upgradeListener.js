
module.exports = function websocketListener(request, socket, head) {
  console.log('SOCKET INFO');
  console.log('address:', socket.address());
  console.log('localAddress', socket.localAddress);
  console.log('localPort', socket.localPort);
  console.log('remoteAddress', socket.remoteAddress);
  console.log('remoteFamily', socket.remoteFamily);
  console.log('remotePort', socket.remotePort);
};
