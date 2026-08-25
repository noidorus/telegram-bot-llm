export interface TelegramBotConfig {
  telegramBotToken: string;
  llmInferenceUrl: string;
}

function readRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadTelegramBotConfig(): TelegramBotConfig {
  const telegramBotToken = readRequiredEnvVar("TELEGRAM_BOT_TOKEN");
  const llmInferenceUrl = readRequiredEnvVar("LLM_INFERENCE_URL");

  return {
    telegramBotToken,
    llmInferenceUrl,
  };
}
