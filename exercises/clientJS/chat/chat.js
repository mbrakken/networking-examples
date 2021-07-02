import { $ } from '../modules/utilities.js';

let socket;

const connectButton = $('connectSocket');
const input = $('entry');
const chatBox = $('chatBox');
const output = $('output');

function socketOpen() {
  socket.send('Hello!');
  connectButton.setAttribute('disabled', true);
  output.innerHTML += 'Connected<br />';
}

function socketMessage(event) {
  console.log('Received:', event.data);
  output.innerHTML += `Received: ${event.data}<br />`;
}

function socketError(error) {
  console.log('Socket error:', error);
  output.innerHTML += `Error, shutting down: ${error}<br />`;
  socket.close();
}

function socketClose(event) {
  console.log('Socket closed', event);
  connectButton.removeAttribute('disabled');
  output.innerHTML += `Socket closed<br />`;
}

connectButton.addEventListener('click', () => {
  output.innerHTML += 'Connecting...<br />';
  socket = new WebSocket('ws://127.0.0.1:8765');

  socket.addEventListener('open', socketOpen);
  socket.addEventListener('message', socketMessage);
  socket.addEventListener('error', socketError);
  socket.addEventListener('close', socketClose);
});

chatBox.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!socket || socket.readyState !== socket.OPEN) {
    return window.alert('Socket is not available');
  }

  const value = input.value;
  output.innerHTML += `Sending: ${value}<br />`;
  socket.send(value);
  input.value = '';
});
