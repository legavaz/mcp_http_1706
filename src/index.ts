import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMCPServer } from './server.js';

const app = express();
const port = process.env.PORT || 3000;

// Хранилище транспортов для каждого клиента
const transports: Map<string, SSEServerTransport> = new Map();

// Эндпоинт для SSE подключения
app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/message', res);
  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);

  const server = createMCPServer();
  await server.connect(transport);

  req.on('close', () => {
    transports.delete(sessionId);
  });
});

// Эндпоинт для получения сообщений от клиента
app.post('/message', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send('Session not found');
  }
});

app.listen(port, () => {
  console.error(`MCP HTTP server running on http://localhost:${port}/sse`);
});