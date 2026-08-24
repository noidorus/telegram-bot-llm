export interface LlmInferenceConfig {
  llmProvider: string;
  llmModel: string;
  llmBaseUrl: string;
}

function readRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadLlmInferenceConfig(): LlmInferenceConfig {
  const llmProvider = readRequiredEnvVar("LLM_PROVIDER");
  const llmModel = readRequiredEnvVar("LLM_MODEL");
  const llmBaseUrl = readRequiredEnvVar("LLM_BASE_URL");

  return {
    llmProvider,
    llmModel,
    llmBaseUrl,
  };
}
