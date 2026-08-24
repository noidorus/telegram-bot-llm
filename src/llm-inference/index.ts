import { loadLlmInferenceConfig } from "./config.ts";

function main(): void {
  try {
    loadLlmInferenceConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown configuration error";
    console.error(`LLM inference configuration error: ${message}`);
    process.exit(1);
  }

  // TODO: HTTP server and provider logic are implemented in later tasks (4.x, 5.x).
}

main();
