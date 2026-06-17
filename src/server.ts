import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Создаёт и возвращает MCP сервер с тремя учебными инструментами.
 */
export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'simple-http-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // --- 1. Регистрируем список доступных инструментов ---
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'calculator',
        description: 'Простой калькулятор. Поддерживает: add, subtract, multiply, divide',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'Первое число' },
            b: { type: 'number', description: 'Второе число' },
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'multiply', 'divide'],
              description: 'Операция',
            },
          },
          required: ['a', 'b', 'operation'],
        },
      },
      {
        name: 'echo',
        description: 'Возвращает переданный текст',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Текст для повторения' },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_timestamp',
        description: 'Возвращает текущее время в UTC и Unix форматах',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }));

  // --- 2. Обрабатываем вызов инструментов ---
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'calculator': {
        const { a, b, operation } = args as { a: number; b: number; operation: string };
        let result: number;

        switch (operation) {
          case 'add':
            result = a + b;
            break;
          case 'subtract':
            result = a - b;
            break;
          case 'multiply':
            result = a * b;
            break;
          case 'divide':
            if (b === 0) {
              return {
                content: [{ type: 'text', text: 'Ошибка: деление на ноль' }],
                isError: true,
              };
            }
            result = a / b;
            break;
          default:
            return {
              content: [{ type: 'text', text: `Неизвестная операция: ${operation}` }],
              isError: true,
            };
        }

        return {
          content: [{ type: 'text', text: String(result) }],
        };
      }

      case 'echo': {
        const { text } = args as { text: string };
        return {
          content: [{ type: 'text', text }],
        };
      }

      case 'get_timestamp': {
        const now = new Date();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  utc: now.toUTCString(),
                  iso: now.toISOString(),
                  unix: Math.floor(now.getTime() / 1000),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Неизвестный инструмент: ${name}` }],
          isError: true,
        };
    }
  });

  return server;
}
