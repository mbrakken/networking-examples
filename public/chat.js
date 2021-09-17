import { $ } from './modules/utilities.js';

let socket;

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

  socket = new WebSocket('ws://127.0.0.1:8765');

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