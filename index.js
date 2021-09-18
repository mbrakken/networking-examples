const http = require('http');
const { promises: fs, createReadStream } = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const redis = require('redis');

const mimeTypes = require('./utilities/mimeTypes');
const queryStringToObject = require('./utilities/queryStringToObject');
const findAnagrams = require('./utilities/findAnagrams');

const PORT = process.env.PORT || 8765;
const redisURL = process.env.REDISTOGO_URL || 'redis://localhost:6379';

const publicPath = path.resolve(__dirname, 'public');

console.log(process.env);

const server = http.createServer((request, response) => {
  console.log('Request:', request.method, request.url);

  switch (request.method) {
    case 'GET':
      handleGET(request, response);
      break;

    case 'POST':
      processData(request, response);
      break;

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

// process.on('uncaughtException', (e) => {
//   console.error('\nuncaughtException, SHUTTING DOWN');
//   console.error(e);
//   server.close(() => {
//     console.log('\nSERVER SHUT DOWN FROM UNCAUGHT EXCEPTION');
//     process.exit(1);
//   });
// });

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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nServer listening at http://127.0.0.1:${PORT}`);
});

function handleGET(request, response) {
  const [requestPath, query] = request.url.split('?');

  switch (requestPath) {
    case '/anagrams/anagrams.csv':
      getAnagrams(query, response);
      break;

    default:
      serveFile(request, response);
  }
}

async function serveFile(request, response) {
  let filepath = path.join(publicPath, request.url);

  try {
    const stats = await fs.stat(filepath);

    if (stats.isDirectory()) {
      filepath = path.join(filepath, 'index.html');
    }

    const extension = String(path.extname(filepath)).toLowerCase();

    const contentType = mimeTypes[extension] || 'application/octet-stream';

    const stream = createReadStream(path.resolve(publicPath, filepath));

    response.writeHead(200, { 'Content-Type': contentType });
    stream.pipe(response);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const stream404 = createReadStream(path.resolve(publicPath, '404.html'));

      response.writeHead(404, { 'Content-Type': 'text/html' });
      stream404.pipe(response);
    } else {
      const body = `${http.STATUS_CODES[500]}\r\nUnexpected error: ${error.code} ..\n`;

      response.writeHead(500, {
        'Content-Length': Buffer.byteLength(body, 'utf-8'),
        'Content-Type': 'text/plain',
      });
      response.end(body);
    }
  }
}

function getAnagrams(query = '', response) {
  const params = queryStringToObject(query);

  if (typeof params.word !== 'string') {
    const body = http.STATUS_CODES[400];

    response.writeHead(400, {
      'Content-Length': Buffer.byteLength(body, 'utf-8'),
      'Content-Type': 'text/plain',
    });
    response.end(body);
  } else {
    const body = findAnagrams(params.word).join(',');

    response.writeHead(200, {
      'Content-Length': Buffer.byteLength(body, 'utf-8'),
      'Content-Type': mimeTypes['.csv'],
    });
    response.end(body, 'utf-8');
  }
}

function processData(request, response) {
  let chunks = '';

  request.on('data', (chunk) => {
    console.log('GOT CHUNK', chunk);
    chunks += chunk;
  });

  request.on('end', () => {
    console.log('DATA RECEIVED. PROCESS & RESPOND.');

    response.writeHead(204);
    response.end();
  });
}

const wss = new WebSocketServer({ server });

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

wss.on('connection', function connection(ws) {
  // console.log('Got a connection', ws);

  const publisher = redis.createClient({ url: redisURL });
  const subscriber = redis.createClient({ url: redisURL });
  // const subcriptions = [];

  let yourName;

  subscriber.on('subscribe', () => {});

  subscriber.on('message', (channel, publishedMessage) => {
    // console.log('subscriber got message', channel, publishedMessage);

    try {
      const { person, message } = JSON.parse(publishedMessage);
      ws.send(`{{${channel}}} ${person}: ${message}`);
    } catch (e) {
      console.error('Failed to parse message', e);
      ws.send(
        `{{${channel}}}: Chatbort is sad and could not understand "${publishedMessage}"`
      );
    }
  });

  ws.on('message', function incoming(incomingMessage) {
    console.log('received: %s', incomingMessage);

    const { command, message } = parseMessage(incomingMessage);

    switch (command) {
      case '/name':
        yourName = message;

        subscriber.subscribe('general', () => {
          ws.send(`Welcome to Chatbort, ${message}`);

          publisher.publish(
            'general',
            JSON.stringify({
              person: 'ChatBort',
              message: `${message} has joined the chatbort.`,
            })
          );
        });
        break;

      case '/subscribe':
        ws.send(`You've subscribed to the ${message} channel`);
        break;

      case '/create':
        ws.send(`You've created the "${message}" channel. Tell your friends!`);
        break;

      case null:
      case undefined:
        publisher.publish(
          'general',
          JSON.stringify({
            person: yourName,
            message: incomingMessage.toString(),
          })
        );
        break;

      default:
        ws.send(`We did not understand "${command}". Sorry!`);
        break;
    }
  });

  ws.send(`
  Welcome to to Chatbort!
  To get started, here are some commands you can send: 
  /name Chatbort
  /subscribe Puppytime
  /create Kittentime
`);
});
