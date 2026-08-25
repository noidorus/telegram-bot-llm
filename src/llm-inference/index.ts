import { loadLlmInferenceConfig, type LlmInferenceConfig } from "./config.ts";
import { createOllamaProvider } from "./ollamaProvider.ts";
import type { LlmProvider } from "./provider.ts";
import { createLlmInferenceServer } from "./server.ts";

const HOST = "127.0.0.1";

// config.llmProvider currently only supports "ollama". If another backend is
// added later, select the provider implementation based on that value here.
function createProvider(config: LlmInferenceConfig): LlmProvider {
  return createOllamaProvider({ baseUrl: config.llmBaseUrl, model: config.llmModel });
}

async function main(): Promise<void> {
  let config: LlmInferenceConfig;
  try {
    config = loadLlmInferenceConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown configuration error";
    console.error(`LLM inference configuration error: ${message}`);
    process.exit(1);
  }

  const server = createLlmInferenceServer({
    host: HOST,
    port: config.llmInferencePort,
    provider: createProvider(config),
  });

  await server.listen();
  console.log(`LLM inference server listening on http://${HOST}:${config.llmInferencePort}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`LLM inference server failed to start: ${message}`);
  process.exit(1);
});
