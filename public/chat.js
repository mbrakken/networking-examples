import { $ } from './modules/utilities.js';

let socket;
const localhosts = ['localhost', '127.0.0.1'];

const connectButton = $('connectSocket');
const input =  $('entry');
const form = $('chatBox');
const output = $('output');

connectButton.addEventListener('click', connectSocket);
form.addEventListener('submit', (evt) => {
  evt.preventDefault();

  socket.send(input.value);
  output.innerHTML += input.value + '<br />';
  input.value = '';
});

function connectSocket() {
  connectButton.setAttribute('disabled', true);
  const host = window.location.origin.replace(/^http/, 'ws');
  socket = new WebSocket(host);

  socket.onconnect = function(evt) {
    console.log('connect', evt);
  }

  socket.onclose = function(evt) {
    console.log('close', evt);

    connectButton.removeAttribute('disabled');
  }

  socket.onmessage = function(evt) {
    console.log('message', evt);
    output.innerHTML += evt.data + '<br />';
  }
}