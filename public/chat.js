import { $ } from './modules/utilities.js';

let socket;
let currentName = '';
const localhosts = ['localhost', '127.0.0.1'];

const connectButton = $('connectSocket');
const input = $('entry');
const form = $('chatBox');
const output = $('output');

connectButton.addEventListener('click', function connectSocket() {
  connectButton.setAttribute('disabled', true);
  const host = window.location.origin.replace(/^http/, 'ws');
  socket = new WebSocket(host);

  socket.onconnect = function (evt) {
    console.log('connect', evt);
    if (currentName) {
      socket.send(`/name ${currentName}`);
    }
  };

  socket.onclose = function (evt) {
    console.log('close', evt);

    connectButton.removeAttribute('disabled');
    output.innerHTML +=
      'You have been disconnected from the server...' + '<br />';
  };

  socket.onmessage = function (evt) {
    console.log('message', evt);
    output.innerHTML += evt.data + '<br />';
  };
});

const nameRX = /^\/name\w/;

form.addEventListener('submit', (evt) => {
  evt.preventDefault();
  const { value } = input;
  if (nameRX.test(value)) {
    currentName = value.replace(nameRX, '').trim();
  }

  socket.send(value);
  input.value = '';
});
