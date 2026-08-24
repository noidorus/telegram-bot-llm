import { loadLlmInferenceConfig, type LlmInferenceConfig } from "./config.ts";
import { createLlmInferenceServer } from "./server.ts";

const HOST = "127.0.0.1";

// TODO: Replace with a real LLM provider selected via config.llmProvider (see phase 5).
async function generateStub(prompt: string): Promise<string> {
  return `Stub response for prompt: "${prompt}"`;
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
    generate: generateStub,
  });

  await server.listen();
  console.log(`LLM inference server listening on http://${HOST}:${config.llmInferencePort}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`LLM inference server failed to start: ${message}`);
  process.exit(1);
});
