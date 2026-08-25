## Context

The change introduces two independently running processes:

1. a Telegram bot process responsible for Telegram Bot API communication and message handling;
2. an LLM inference process responsible for communicating with a local language model backend.

The Telegram bot must not depend directly on a specific LLM implementation. Communication between the two processes will use a small HTTP API.

The first inference backend will be Ollama. The architecture must allow another local inference backend, such as vLLM, to be introduced without changing Telegram-specific code.

The system does not require persistent storage or conversation state. Each inference request is independent.

See `proposal.md` for the motivation and `specs/telegram-bot/spec.md` and `specs/llm-inference/spec.md` for the behavioral requirements.

## Goals / Non-Goals

**Goals:**

* Separate Telegram message handling from LLM inference.
* Run the Telegram bot and LLM inference as independent Node.js processes.
* Communicate between the processes through a small HTTP interface.
* Hide the concrete LLM backend behind an inference provider abstraction.
* Use Ollama as the initial inference backend.
* Allow the inference backend to be replaced without modifying Telegram-specific code.
* Keep the application small and easy to run locally or on a low-cost server.
* Keep external dependencies to a minimum.
* Keep secrets and runtime configuration outside the source code.

**Non-Goals:**

* Persistent conversation history.
* Database integration.
* Authentication between the Telegram bot and inference process.
* Streaming LLM responses.
* Webhooks.
* Message queues.
* Distributed deployment.
* Agent tools, function calling, RAG, embeddings, or long-term memory.

## Decisions

### 1. Use two independent processes

The Telegram bot and LLM inference will run as separate processes.

The Telegram bot process will be responsible for:

* receiving Telegram updates;
* extracting text messages;
* calling the inference HTTP API;
* sending generated responses back to Telegram.

The inference process will be responsible for:

* receiving inference requests;
* selecting the configured LLM provider;
* calling the configured local inference backend;
* returning the generated text.

This separation prevents the Telegram application from becoming coupled to a specific inference implementation.

**Alternative considered:** Run LLM integration inside the Telegram process.

This would be simpler for the initial implementation but would tightly couple Telegram handling to the inference backend and make independent deployment or replacement of the inference layer harder.

### 2. Use HTTP between the bot and inference processes

The two processes will communicate through a small internal HTTP API.

The initial API will expose a single inference operation:

```text
POST /generate
```

Request:

```json
{
  "prompt": "Hello"
}
```

Successful response:

```json
{
  "text": "Hello! How can I help you?"
}
```

Errors will use appropriate HTTP status codes and a structured error response.

The API is intentionally minimal because the current application does not require conversation state, streaming, tools, or other agent functionality.

**Alternative considered:** Use a shared library or direct process communication.

HTTP provides a clearer process boundary and allows the inference process to be moved to another host later without changing the conceptual architecture.

### 3. Use a provider abstraction inside the inference process

The inference process will define a provider abstraction responsible for text generation.

Conceptually:

```typescript
interface LlmProvider {
  generate(prompt: string): Promise<string>;
}
```

The first implementation will target Ollama.

Future implementations can target vLLM or another compatible inference backend.

The Telegram bot will communicate only with the inference HTTP API and will not import or reference Ollama-specific code.

**Alternative considered:** Implement separate Ollama and vLLM logic directly in the Telegram bot.

This would increase coupling and make the Telegram application responsible for infrastructure-specific behavior.

### 4. Use Ollama as the initial inference backend

Ollama will be used for the first implementation because it provides a simple local HTTP interface and allows the application to run with small local models.

The model name will be provided through configuration rather than hard-coded.

Initial recommended models are:

```text
qwen3:1.7b
tinyllama
```

The architecture does not depend on either model.

**Alternative considered:** Implement vLLM first.

vLLM is suitable for higher-performance inference and larger deployments, but Ollama provides a simpler initial development environment for this minimal application.

### 5. Use Telegram Bot API directly over HTTP

The Telegram bot will communicate with Telegram through direct HTTP requests to the Telegram Bot API.

No Telegram-specific SDK or bot framework will be used.

The bot will initially use long polling through the `getUpdates` API.

Telegram-specific HTTP details will be isolated inside the Telegram API integration layer.

**Alternative considered:** Use a Telegram SDK.

An SDK would reduce implementation effort but would introduce an additional abstraction and dependency that is unnecessary for this learning-oriented minimal implementation.

### 6. Use long polling for Telegram updates

The initial Telegram integration will use long polling.

The bot will repeatedly request updates and maintain the Telegram update offset to avoid processing the same update more than once.

Webhook-based delivery is intentionally deferred.

**Alternative considered:** Telegram webhooks.

Webhooks require externally accessible HTTPS infrastructure and additional deployment configuration. Long polling is simpler for the initial local and low-cost server deployment.

### 7. Keep request context stateless

The inference API will receive only the current prompt.

The bot will not send previous messages as context, and the inference process will not persist conversation history.

The expected request flow is:

```text
Telegram message
      ↓
Bot process
      ↓
POST /generate
      ↓
Inference process
      ↓
LLM provider
      ↓
Generated text
      ↓
Bot process
      ↓
Telegram
```

This keeps the first implementation stateless and avoids introducing a database or session-management layer.

### 8. Use environment-based configuration

Runtime configuration will be provided through environment variables.

The Telegram bot process will require:

```text
TELEGRAM_BOT_TOKEN
LLM_INFERENCE_URL
```

The inference process will require configuration for the selected provider, including:

```text
LLM_PROVIDER
LLM_MODEL
LLM_BASE_URL
```

may be used for local development.

`.env` must not be committed to Git.

`.env.example` will document the required configuration without containing real secrets.

### 9. Keep process configuration separate

The Telegram bot process and inference process will have separate configuration responsibilities.

Example:

```text
Bot process
├── TELEGRAM_BOT_TOKEN
└── LLM_INFERENCE_URL

Inference process
├── LLM_PROVIDER
├── LLM_MODEL
└── LLM_BASE_URL
```

This prevents Telegram credentials from being unnecessarily exposed to the inference process.

### 10. Handle failures at process boundaries

A failure in the inference process must not directly terminate the Telegram bot process.

If the inference service is unavailable, the bot will catch the HTTP request failure, record a technical error, and continue processing future Telegram updates.

Similarly, an error while processing one Telegram update must not terminate the polling loop.

The inittroduce a message queue or retry infrastructure.

## Risks / Trade-offs

* [Risk] The inference process becomes unavailable → The bot will return a controlled error to the user and continue running.
* [Risk] HTTP introduces an additional process boundary → The API remains intentionally small and local communication overhead is acceptable for this application.
* [Risk] Long polling is less suitable for large-scale deployment → Webhooks can be introduced later without changing the LLM inference architecture.
* [Risk] Small local models may produce low-quality responses → The model is configurable, allowing a larger model to be selected without changing application logic.
* [Risk] The internal inference API has no authentication → For the initial deployment it is intended to bind to localhost or a private network interface and must not be exposed publicly.
* [Risk] A single inference process limits throughput → Horizontal scaling and request queues are intentionally deferred until required.

## Mig
No data migration is required because the first version does not persist application state.

Initial deployment:

1. Install Node.js and project dependencies.
2. Install and configure Ollama.
3. Download the selected local model.
4. Configure environment variables for both processes.
5. Start the inference process.
6. Start the Telegram bot process.
7. Verify Telegram → bot → inference → LLM → Telegram flow.

Rollback:

1. Stop the Telegram bot process.
2. Stop the inference process.
3. Remove or revert the application deployment.
4. No persistent application data requires cleanup.

The inference backend can later be replaced by implementing another provider without changing the Telegram process.

## Open Questions

None. The remaining implementation details can be resolved during task execution without changing the defined specifications or architecture.

