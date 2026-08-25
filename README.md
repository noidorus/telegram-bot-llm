# telegram-bot-llm

A minimal Telegram bot that forwards user messages to a local LLM and sends the generated reply back — no conversation history, no database, no Telegram SDK.

```text
Telegram → Bot Process → HTTP → Inference Process → LLM → HTTP → Bot Process → Telegram
```

Each message is handled as an independent request. There is currently no memory of previous messages.

## Architecture

The project consists of two independent Node.js processes that only communicate over HTTP:

- **`src/telegram-bot/`** — talks to the Telegram Bot API directly over HTTP (no SDK). Uses long polling (`getUpdates`) to receive messages, extracts the chat ID and text, calls the inference API, and sends the response back with `sendMessage`.
- **`src/llm-inference/`** — exposes a `POST /generate` HTTP endpoint, validates the request, and forwards the prompt to a configured `LlmProvider` implementation (currently [Ollama](https://ollama.com)).

The Telegram bot has no knowledge of Ollama or any specific model — it only knows the inference HTTP API. The inference process can be stopped, restarted, or replaced independently of the bot.

```text
Telegram Bot                      LLM Inference
─────────────                     ─────────────
getUpdates (long polling)         POST /generate
  → parse chat id + text            → validate request
  → POST /generate    ────HTTP───→   → LlmProvider.generate()
  → sendMessage                        → Ollama API
                                    ← generated text
```

## Requirements

- Node.js `>= 22.6.0` (uses `--experimental-strip-types` to run TypeScript directly, no build step required for local development)
- [Ollama](https://ollama.com) running locally with a pulled model (default: `qwen3:1.7b`)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Used by | Description |
   | --- | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | telegram-bot | Bot token from BotFather. Required. |
   | `LLM_INFERENCE_URL` | telegram-bot | Base URL of the inference process, e.g. `http://localhost:3001`. Required. |
   | `LLM_PROVIDER` | llm-inference | LLM backend to use. Currently only `ollama`. Required. |
   | `LLM_MODEL` | llm-inference | Model name to request from the provider, e.g. `qwen3:1.7b`. Required. |
   | `LLM_BASE_URL` | llm-inference | Base URL of the Ollama server, e.g. `http://localhost:11434`. Required. |
   | `LLM_INFERENCE_PORT` | llm-inference | Port for the inference HTTP server. Optional, defaults to `3001`. Should match `LLM_INFERENCE_URL`. |

   Never commit `.env` — it is already covered by `.gitignore`. Only `.env.example` (with no real secrets) is tracked.

3. Install [Ollama](https://ollama.com) if you don't have it yet:

   ```bash
   # macOS
   brew install ollama

   # Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows
   # download the installer from https://ollama.com/download
   ```

   Start the Ollama server (skip this if it's already running as a background service, e.g. after a `brew services start ollama` or the desktop app):

   ```bash
   ollama serve
   ```

   Verify it's up:

   ```bash
   curl http://localhost:11434/api/tags
   ```

4. Pull the model configured in `LLM_MODEL` (default `qwen3:1.7b`, a small Qwen 3 model — about 1.4 GB, good for local testing on modest hardware):

   ```bash
   ollama pull qwen3:1.7b
   ```

   Other Qwen sizes work the same way if you want a larger/more capable model instead — just update `LLM_MODEL` in `.env` to match, e.g.:

   ```bash
   ollama pull qwen3:8b
   ```

   Confirm the model is available:

   ```bash
   ollama list
   ```

## Running

Start both processes in separate terminals (order doesn't matter, but the bot needs the inference service reachable to answer messages):

```bash
# Terminal 1 — LLM inference process
npm run start:llm-inference

# Terminal 2 — Telegram bot process
npm run start:telegram-bot
```

Both scripts load variables from `.env` via Node's `--env-file`. The file must exist and contain the required values.

The inference server binds to a local/private interface (`127.0.0.1`) only — it is not meant to be exposed publicly.

## Build

TypeScript compilation (type-checking + emitting JS to `dist/`):

```bash
npm run build
```

This is not required to run the app locally (see [Running](#running)), but is useful for verifying types and for production deployments.

## Project layout

```text
src/
  telegram-bot/       Telegram Bot API integration (long polling, sendMessage, config)
  llm-inference/       Inference HTTP server, request validation, provider abstraction, Ollama provider
```

## Extending

- **New LLM provider**: implement the `LlmProvider` interface (`src/llm-inference/provider.ts`) and select it based on `LLM_PROVIDER` in `src/llm-inference/index.ts`. The Telegram bot requires no changes.
- **Conversation memory**: intentionally out of scope for now — see `openspec/changes/add-telegram-llm-bot/design.md` for the reasoning. Adding it later is a separate architectural decision.

## OpenSpec

This project uses [OpenSpec](https://github.com/openspec-ai/openspec) as the source of truth for requirements and implementation planning. See `openspec/changes/add-telegram-llm-bot/` for the proposal, specs, design decisions, and task breakdown behind the current implementation.
