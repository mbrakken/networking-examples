const http = require('http');
const { promises: fs, createReadStream } = require('fs');
const path = require('path');

const mimeTypes = require('./utilities/mimeTypes');
const queryStringToObject = require('./utilities/queryStringToObject');
const findAnagrams = require('./utilities/findAnagrams');
const websocketListener = require('./utilities/websocketListener');

const PORT = process.env.PORT || 8765;

const publicPath = path.resolve(__dirname, 'public');

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

server.on('error', (err) => {
  console.error(`Server error: ${err.stack}`);
  process.exit(1);
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

server.on('upgrade', websocketListener);

process.on('uncaughtException', (e) => {
  console.error('\nuncaughtException, SHUTTING DOWN');
  console.error(e);
  server.close(() => {
    console.log('\nSERVER SHUT DOWN FROM UNCAUGHT EXCEPTION');
  });
});

process.on('unhandledRejection', (e) => {
  console.error('\nunhandledRejection, SHUTTING DOWN');
  console.error(e);
  server.close(() => {
    console.log('\nSERVER SHUT DOWN FROM UNHANDLED REJECTION');
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down');
});

process.on('SIGINT', () => {
  console.log('\nForce-closing all open sockets...');
  process.exit(0);
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

    case '/chat':
      handleChat(request, response);
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

function handleChat(request, response) {
  console.log('GOT CHAT');

  response.writeHead(204);
  response.end();
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
