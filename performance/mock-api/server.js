const http = require('node:http');

const PORT = 8080;
const records = new Map();

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://mock-api');

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { status: 'ready' });
    return;
  }

  const itemMatch = /^\/api\/items\/(\d+)$/.exec(url.pathname);
  if (request.method === 'GET' && itemMatch) {
    const id = Number(itemMatch[1]);
    if (!Number.isInteger(id) || id < 1 || id > 10) {
      sendJson(response, 404, { error: 'Item not found' });
      return;
    }
    sendJson(response, 200, {
      id,
      name: `Item ${id}`,
      price: id * 10,
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/records') {
    try {
      let rawBody = '';
      for await (const chunk of request) {
        rawBody += chunk;
        if (rawBody.length > 1024) {
          sendJson(response, 413, { error: 'Payload too large' });
          return;
        }
      }

      const body = JSON.parse(rawBody);
      if (
        typeof body.id !== 'string' ||
        !/^vu-\d+-iter-\d+$/.test(body.id) ||
        !Number.isInteger(body.value) ||
        body.value < 0 ||
        body.value > 99
      ) {
        sendJson(response, 400, { error: 'Invalid record' });
        return;
      }

      records.set(body.id, body.value);
      sendJson(response, 201, {
        id: body.id,
        value: records.get(body.id),
        stored: true,
      });
    } catch {
      if (!response.headersSent) {
        sendJson(response, 400, { error: 'Invalid JSON' });
      }
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API listening on port ${PORT}`);
});
