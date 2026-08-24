import { loadLlmInferenceConfig, type LlmInferenceConfig } from "./config.ts";
import type { LlmProvider } from "./provider.ts";
import { createLlmInferenceServer } from "./server.ts";

const HOST = "127.0.0.1";

// TODO: Replace with a real Ollama-backed provider selected via config.llmProvider (see task 5.2).
const stubProvider: LlmProvider = {
  async generate(prompt: string): Promise<string> {
    return `Stub response for prompt: "${prompt}"`;
  },
};

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
    provider: stubProvider,
  });

  await server.listen();
  console.log(`LLM inference server listening on http://${HOST}:${config.llmInferencePort}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`LLM inference server failed to start: ${message}`);
  process.exit(1);
});
