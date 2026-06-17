# MCP HTTP Server (обучающий проект)

Простой MCP сервер на TypeScript с HTTP+SSE транспортом для изучения протокола MCP.

## Что такое MCP?

**MCP (Model Context Protocol)** — это протокол, который позволяет AI-ассистентам (например, Cline) подключать внешние инструменты и данные. Сервер предоставляет набор инструментов (tools), которые AI может вызывать для выполнения действий.

## Что внутри

Сервер реализует 3 учебных инструмента:

| Инструмент | Описание | Параметры |
|-----------|----------|-----------|
| `calculator` | Простой калькулятор | `a` (number), `b` (number), `operation` ("add"/"subtract"/"multiply"/"divide") |
| `echo` | Возвращает переданный текст | `text` (string) |
| `get_timestamp` | Текущее время в UTC, ISO и Unix форматах | нет параметров |

## Архитектура

Сервер использует **HTTP + SSE (Server-Sent Events)** транспорт:

```
Клиент (Cline, любой MCP-клиент)
    │
    ├── GET  /sse           ← SSE-канал для получения ответов от сервера
    │     (сервер шлёт события клиенту)
    │
    └── POST /message?sessionId=xxx   ← отправка команд (JSON-RPC)
          (клиент вызывает инструменты)
```

### Как это работает:

1. Клиент открывает `GET /sse` — устанавливается постоянное соединение, сервер выдаёт `sessionId`
2. Клиент отправляет JSON-RPC запрос через `POST /message?sessionId=xxx` с именем инструмента и аргументами
3. Сервер обрабатывает запрос и отправляет результат обратно через SSE

### Структура проекта

```
mcp_http_1706/
  ├── package.json          # Зависимости и скрипты
  ├── tsconfig.json         # Настройки TypeScript
  ├── README.md             # Этот файл
  ├── src/
  │   ├── index.ts          # Точка входа: HTTP сервер (Express + SSE)
  │   └── server.ts         # MCP сервер с инструментами
  └── build/                # Скомпилированные JS файлы
```

## Требования

- **Node.js** 18+ (скачать: https://nodejs.org)
- **npm** (устанавливается вместе с Node.js)

## Установка и сборка

```bash
# 1. Установить зависимости
npm install

# 2. Скомпилировать TypeScript в JavaScript
npm run build
```

## Запуск

```bash
npm start
# или
node build/index.js
```

Сервер запустится на `http://localhost:3000`.

В терминале появится сообщение:
```
MCP HTTP server running on http://localhost:3000/sse
```

## Проверка работы

### 1. Открыть SSE-канал (терминал 1):

```bash
curl -N http://localhost:3000/sse
```

В ответ придёт:
```
event: endpoint
data: /message?sessionId=xxx
```
Запомните `sessionId`.

### 2. Вызвать инструмент (терминал 2):

```bash
curl -X POST "http://localhost:3000/message?sessionId=xxx" ^
  -H "Content-Type: application/json" ^
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"calculator\",\"arguments\":{\"a\":10,\"b\":5,\"operation\":\"add\"}}}"
```

Где `sessionId=xxx` — ID из первого шага.

В первом терминале появится ответ:
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"15"}]}}
```

### Примеры запросов:

**echo:**
```bash
curl -X POST "http://localhost:3000/message?sessionId=xxx" ^
  -H "Content-Type: application/json" ^
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"echo\",\"arguments\":{\"text\":\"Привет, MCP!\"}}}"
```

**get_timestamp:**
```bash
curl -X POST "http://localhost:3000/message?sessionId=xxx" ^
  -H "Content-Type: application/json" ^
  -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"get_timestamp\",\"arguments\":{}}}"
```

## Подключение к Cline

Чтобы Cline мог использовать инструменты этого сервера, нужно добавить его в конфигурацию MCP.

**Файл конфигурации Cline:**
`C:\Users\lega\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

Добавить в `mcpServers`:
```json
"mcp-http-server": {
  "autoApprove": [
    "calculator",
    "echo",
    "get_timestamp"
  ],
  "disabled": false,
  "timeout": 60,
  "type": "stdio",
  "command": "node",
  "args": [
    "d:\\project\\ai\\mcp_http_1706\\build\\index.js"
  ]
}
```

> **Примечание:** В текущей версии Cline используется stdio транспорт, поэтому сервер конфигурируется как `"type": "stdio"`, а Cline сам запускает его. HTTP+SSE версия нужна для понимания протокола и ручного тестирования.

## Формат JSON-RPC

MCP использует протокол **JSON-RPC 2.0**. Каждый запрос содержит:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": {
      "a": 10,
      "b": 5,
      "operation": "add"
    }
  }
}
```

- `jsonrpc` — версия протокола (всегда "2.0")
- `id` — уникальный номер запроса
- `method` — вызываемый метод ("tools/call" — вызов инструмента)
- `params` — параметры: имя инструмента и его аргументы

Ответ:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "15" }
    ]
  }
}
```

## Полезные ссылки

- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [MCP SDK for TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)