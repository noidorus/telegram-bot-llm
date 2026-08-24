## 1. Project Setup

* [x] 1.1 Initialize the Node.js TypeScript project structure and verify that the TypeScript project compiles successfully
* [x] 1.2 Configure the project scripts for running the Telegram bot process and LLM inference process separately, and verify both commands are available
* [x] 1.3 Create `.env.example` with all required configuration variables and verify that no real secrets are present
* [x] 1.4 Add `.env` and other local secret files to `.gitignore` and verify they are ignored by Git

## 2. Configuration

* [x] 2.1 Implement configuration loading and validation for the Telegram bot process, including `TELEGRAM_BOT_TOKEN` and `LLM_INFERENCE_URL`, and verify startup fails clearly when required values are missing
* [x] 2.2 Implement configuration loading and validation for the inference process, including `LLM_PROVIDER`, `LLM_MODEL`, and `LLM_BASE_URL`, and verify startup fails clearly when required values are missing
* [x] 2.3 Verify that secret values are never written to application source code or startup logs

## 3. Telegram Bot API

* [x] 3.1 Implement a minimal HTTP client for Telegram Bot API requests without using a Telegram SDK and verify a test API request can be executed successfully
* [x] 3.2 Implement Telegram `getUpdates` long polling with update offset management and verify that each update is received only once
* [x] 3.3 Implement Telegram `sendMessage` and verify that a test message can be delivered to a Telegram chat
* [x] 3.4 Implement extraction of the originating chat ID and text from Telegram updates and verify valid text messages are parsed correctly
* [ ] 3.5 Ignore updates that do not contain text messages and verify they do not reach the inference layer

## 4. LLM Inference API

* [ ] 4.1 Implement the inference HTTP server with a `POST /generate` endpoint and verify it accepts a prompt and returns generated text
* [ ] 4.2 Implement request validation for the inference endpoint and verify invalid requests return an appropriate error response
* [ ] 4.3 Implement structured error responses for unavailable or failed inference backends and verify the inference process remains running after an inference failure

## 5. LLM Provider

* [ ] 5.1 Define the LLM provider abstraction and verify the inference service depends only on the provider interface
* [ ] 5.2 Implement the Ollama provider and verify it can generate a response from a configured local model
* [ ] 5.3 Configure the Ollama model through `LLM_MODEL` and verify changing the configured model does not require source code changes
* [ ] 5.4 Verify that the inference API does not expose Ollama-specific implementation details to the Telegram bot

## 6. Telegram-to-LLM Flow

* [ ] 6.1 Connect the Telegram message handler to the inference HTTP API and verify a Telegram text message produces an inference request
* [ ] 6.2 Send the generated inference response back to the originating Telegram chat and verify the user receives the model response
* [ ] 6.3 Verify that each Telegram message is sent to inference independently without previous conversation history
* [ ] 6.4 Handle inference service failures in the Telegram bot and verify the bot continues processing subsequent messages
* [ ] 6.5 Handle Telegram API failures without terminating the polling loop and verify subsequent updates can still be processed

## 7. Process Separation

* [ ] 7.1 Verify the Telegram bot and inference service can be started as independent processes
* [ ] 7.2 Verify the Telegram process communicates with the inference service only through the HTTP API
* [ ] 7.3 Verify the inference service can be stopped and restarted independently from the Telegram bot process
* [ ] 7.4 Verify the inference service is bound to a local or private interface and is not unintentionally exposed as a public service

## 8. Integration Verification

* [ ] 8.1 Start Ollama with a configured test model and verify the model is available
* [ ] 8.2 Start the inference process and verify `POST /generate` returns a valid response
* [ ] 8.3 Start the Telegram bot and send a text message through Telegram, verifying the complete Telegram → inference → LLM → Telegram flow
* [ ] 8.4 Send multiple independent messages and verify no previous message is included as context
* [ ] 8.5 Stop the inference service and verify the Telegram bot reports the failure without terminating
* [ ] 8.6 Run the project validation and TypeScript compilation successfully

