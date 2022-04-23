const http = require('http');
const { WebSocketServer } = require('ws');

const ChatBot = require('./chatbot.js');
const redisClient = require('./utilities/redisClient.js');

const serveFile = require('./lib/serveFile.js');
// const queryStringToObject = require('./utilities/queryStringToObject');
// const findAnagrams = require('./utilities/findAnagrams');
// const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 8765;

process.on('uncaughtExceptionMonitor', (e, origin) => {
  console.error(`\nuncaughtException from ${origin}, SHUTTING DOWN`);
  console.error(e);
});

process.on('unhandledRejection', (e) => {
  console.error('\nunhandledRejection, SHUTTING DOWN');
  console.error(e);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\nSIGTERM, Shutting down');
});

process.on('SIGINT', () => {
  console.log('\nForce-closing all open sockets...');
  process.exit(1);
});

process.on('exit', () => {
  console.log('\nShutting down');
});

async function init() {
  await redisClient.connect();
  const chatBot = new ChatBot(redisClient);
  await chatBot.init();

  const server = http.createServer((request, response) => {
    console.log('Request:', request.method, request.url);

    switch (request.method) {
      case 'GET':
        serveFile(request, response);
        break;

      // case 'POST':
      //   processData(request, response);
      //   break;

      default: {
        const body = `${http.STATUS_CODES[405]}\r\nUnexpected method: ${request.method} ..\n`;

        response.writeHead(405, {
          'Content-Length': Buffer.byteLength(body, 'utf-8'),
          'Content-Type': 'text/plain',
        });

        response.end(body);
        break;
      }
    }
  });

  server.on('clientError', (err, socket) => {
    if (!socket.writable) return;

    let message;

    switch (err.code) {
      case 'ECONNRESET':
        return;

      case 'HPE_HEADER_OVERFLOW':
        message = '431 Request Header Fields Too Large';
        break;

      default:
        message = '400 Bad Request';
        break;
    }

    socket.end(`HTTP/1.1 ${message}\r\n\r\n`);
  });

  server.on('connection', () => {
    console.log('got a connection...');
  });

  server.listen(PORT, () => {
    console.log(`\nServer listening on ${PORT}`);
  });

  // function handleGET(request, response) {
  //   const [requestPath, query] = request.url.split('?');

  //   serveFile(request, response);
  // }

  // function getAnagrams(query = '', response) {
  //   const params = queryStringToObject(query);

  //   if (typeof params.word !== 'string') {
  //     const body = http.STATUS_CODES[400];

  //     response.writeHead(400, {
  //       'Content-Length': Buffer.byteLength(body, 'utf-8'),
  //       'Content-Type': 'text/plain',
  //     });
  //     response.end(body);
  //   } else {
  //     const body = findAnagrams(params.word).join(',');

  //     response.writeHead(200, {
  //       'Content-Length': Buffer.byteLength(body, 'utf-8'),
  //       'Content-Type': mimeTypes['.csv'],
  //     });
  //     response.end(body, 'utf-8');
  //   }
  // }

  // function processData(request, response) {
  //   let chunks = '';

  //   request.on('data', (chunk) => {
  //     console.log('GOT CHUNK', chunk);
  //     chunks += chunk;
  //   });

  //   request.on('end', () => {
  //     console.log('DATA RECEIVED. PROCESS & RESPOND.');

  //     response.writeHead(204);
  //     response.end();
  //   });
  // }

  const wss = new WebSocketServer({ server });

  wss.on('connection', function connection(socket) {
    let yourName;

    socket.on('message', async function incoming(incomingMessage) {
      console.log('received: %s', incomingMessage);

      const { command, message } = parseMessage(incomingMessage);

      switch (command) {
        case '/name': {
          const previousName = yourName;
          yourName = message;

          if (!previousName) {
            await chatBot.addSubscriber('general', socket);
            chatBot.postMessage(`${yourName} has joined the chatbort.`);
          } else {
            chatBot.postMessage(`${previousName} is now "${yourName}".`);
          }
          break;
        }

        case '/subscribe':
          await chatBot.addSubscriber(message, socket);
          socket.send(
            `You would have subscribed to the ${message} channel if channels worked!`
          );
          break;

        case '/create':
          await chatBot.addChannel(message, socket);

          socket.send(
            `You would have created the "${message}" channel if that adding channels worked. Tell your friends!`
          );
          break;

        case null:
        case undefined:
          // add interface for channel name
          chatBot.postMessage(incomingMessage.toString(), yourName);
          break;

        default:
          socket.send(`We did not understand "${command}". Sorry!`);
          break;
      }
    });

    socket.on('close', (code) => {
      console.log('Socket closed with code', code);
      chatBot.hangUp(socket);
    });

    socket.send(`
      Welcome to to Chatbort!
      To get started, here are some commands you can send: 
      /name Chatbort
      /subscribe Puppytime
      /create Kittentime
    `);

    // process.on('uncaughtException', (e) => {
    //   console.error('\nuncaughtException, SHUTTING DOWN');
    //   console.error(e);
    //   server.close(() => {
    //     console.log('\nSERVER SHUT DOWN FROM UNCAUGHT EXCEPTION');
    //     process.exit(1);
    //   });
    // });
  });
}

function parseMessage(aMessage) {
  if (!aMessage) {
    return {};
  }

  console.log('Parse incoming message:', aMessage);
  const stringified = aMessage.toString();
  console.log('stringified:', stringified);

  if (stringified[0] !== '/') {
    return {};
  }

  const [command, ...messageParts] = stringified.split(' ');

  return {
    command,
    message: messageParts.join(' '),
  };
}

init();
