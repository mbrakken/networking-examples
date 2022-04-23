const http = require('http');
const { promises: fs, createReadStream } = require('fs');
const path = require('path');

const mimeTypes = require('../utilities/mimeTypes');

const publicPath = path.resolve(__dirname, '..', 'public');

async function serveFile(request, response) {
  let filepath = path.join(publicPath, request.url);

  try {
    const stats = await fs.stat(filepath);

    if (stats.isDirectory()) {
      filepath = path.join(filepath, 'index.html');
    }

    const extension = String(path.extname(filepath)).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';

    response.writeHead(200, { 'Content-Type': contentType });

    createReadStream(path.resolve(publicPath, filepath)).pipe(response);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404, { 'Content-Type': 'text/html' });

      createReadStream(path.resolve(publicPath, '404.html')).pipe(response);
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

module.exports = serveFile;
