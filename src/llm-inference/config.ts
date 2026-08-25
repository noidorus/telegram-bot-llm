export interface LlmInferenceConfig {
  llmProvider: string;
  llmModel: string;
  llmBaseUrl: string;
  llmInferencePort: number;
}

const DEFAULT_LLM_INFERENCE_PORT = 3001;

function readRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalPortEnvVar(name: string, defaultValue: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid value for environment variable ${name}: expected a positive integer`);
  }

  return parsedValue;
}

export function loadLlmInferenceConfig(): LlmInferenceConfig {
  const llmProvider = readRequiredEnvVar("LLM_PROVIDER");
  const llmModel = readRequiredEnvVar("LLM_MODEL");
  const llmBaseUrl = readRequiredEnvVar("LLM_BASE_URL");
  const llmInferencePort = readOptionalPortEnvVar("LLM_INFERENCE_PORT", DEFAULT_LLM_INFERENCE_PORT);

  return {
    llmProvider,
    llmModel,
    llmBaseUrl,
    llmInferencePort,
  };
}
