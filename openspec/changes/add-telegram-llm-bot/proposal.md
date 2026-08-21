## Why

We need a minimal Telegram bot that demonstrates the complete request flow between a Telegram user and a locally hosted language model: receiving a message from Telegram, sending it to an LLM inference service, and returning the generated response to the user. This establishes a minimal foundation that can later be extended into a full LLM agent without rewriting the Telegram integration.

## What Changes

* Add a Telegram bot that accepts text messages from users.
* Send each user's message to a local LLM inference service.
* Return the generated LLM response to the originating Telegram chat.
* Process each message as an independent request without storing conversation history.
* Introduce an LLM inference abstraction that allows different inference backends to be used.
* Configure the LLM provider through environment variables.
* Integrate with the Telegram Bot API directly over HTTP without using a Telegram SDK.
* Store `TELEGRAM_BOT_TOKEN` securely in `.env` and provide it through environment variables.
* Minimize external dependencies.

## Capabilities

### New Capabilities

* `telegram-bot`: Receive text messages through the Telegram Bot API and send generated responses back to users.
* `llm-inference`: Process user prompts through a local language model using an abstract inference provider.

### Modified Capabilities

## Impact

* New Node.js/TypeScript application code.
* Telegram Bot API.
* Local LLM inference backend, initially Ollama or a compatible API.
* Environment-based configuration.
* `.env` and `.gitignore`.
* External dependencies should be kept to a minimum; specialized Telegram SDKs are not used.
