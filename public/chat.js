import { $ } from './modules/utilities.js';

let socket;
let currentName = '';
// const localhosts = ['localhost', '127.0.0.1'];

const connectButton = $('connectSocket');
const input = $('entry');
const form = $('chatBox');
const output = $('output');

connectButton.addEventListener('click', function connectSocket() {
  connectButton.setAttribute('disabled', true);
  const host = window.location.origin.replace(/^http/, 'ws');
  socket = new WebSocket(host);

  socket.addEventListener('open', function (evt) {
    console.log('open', evt);

    if (currentName) {
      socket.send(
        JSON.stringify({
          command: 'name',
          message: currentName,
          time: Date.now(),
        })
      );
    }
  });

  socket.addEventListener('close', function (evt) {
    console.log('close', evt);

    connectButton.removeAttribute('disabled');

    output.innerHTML +=
      'You have been disconnected from the server...' + '<br />';
  });

  socket.addEventListener('message', function (evt) {
    console.log('message', evt);
    const data = JSON.parse(evt.data);
    let messageHtml = `${data.message}<br />`;
    if (data.command !== 'welcome') {
      messageHtml = `[ ${data.channel} ] <b>${
        data.sender
      }:</b> ${messageHtml}<i>${new Date(
        data.time
      ).toLocaleString()}</i><br />`;
    }
    output.innerHTML += messageHtml;
  });

  socket.addEventListener('error', function (evt) {
    console.log('error', evt);
  });
});

function parseMessage(aMessage) {
  if (!aMessage) {
    return {
      message: aMessage,
    };
  }

  const stringified = aMessage.toString();

  if (stringified[0] !== '/') {
    return {
      message: aMessage,
    };
  }

  const [command, ...messageParts] = stringified.split(' ');

  return {
    command: command.slice(1),
    message: messageParts.join(' '),
  };
}

form.addEventListener('submit', (evt) => {
  evt.preventDefault();
  const { value } = input;

  const messageParts = parseMessage(value);

  if (messageParts.command === 'name') {
    currentName = messageParts.message;
  }
  

  socket.send(
    JSON.stringify({
      ...messageParts,
      time: Date.now(),
    })
  );

  input.value = '';
});
