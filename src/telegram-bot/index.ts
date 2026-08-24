import { loadTelegramBotConfig, type TelegramBotConfig } from "./config.ts";
import { createInferenceClient } from "./inferenceClient.ts";
import { handleTelegramUpdate } from "./handleUpdate.ts";
import { createTelegramApiClient } from "./telegramApi.ts";
import { pollUpdates } from "./updates.ts";

async function main(): Promise<void> {
  let config: TelegramBotConfig;
  try {
    config = loadTelegramBotConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown configuration error";
    console.error(`Telegram bot configuration error: ${message}`);
    process.exit(1);
    return;
  }

  const telegramApiClient = createTelegramApiClient({ botToken: config.telegramBotToken });
  const inferenceClient = createInferenceClient({ baseUrl: config.llmInferenceUrl });

  console.log("Telegram bot started, polling for updates...");

  await pollUpdates(telegramApiClient, (update) =>
    handleTelegramUpdate(update, async (parsedMessage) => {
      const text = await inferenceClient.generate(parsedMessage.text);
      // TODO: send response back to Telegram chat (see task 6.2)
      console.log(`Inference response for chat ${parsedMessage.chatId}: ${text}`);
    }),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Telegram bot failed to start: ${message}`);
  process.exit(1);
});
