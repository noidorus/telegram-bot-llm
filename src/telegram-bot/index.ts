import { loadTelegramBotConfig, type TelegramBotConfig } from "./config.ts";
import { createInferenceClient, type InferenceClient } from "./inferenceClient.ts";
import { handleTelegramUpdate } from "./handleUpdate.ts";
import type { ParsedTextMessage } from "./parseMessage.ts";
import { safeSendTelegramMessage } from "./sendMessage.ts";
import { createTelegramApiClient, type TelegramApiClient } from "./telegramApi.ts";
import { pollUpdates } from "./updates.ts";

const INFERENCE_FAILURE_NOTICE = "Не удалось получить ответ от модели. Попробуйте ещё раз позже.";

/**
 * Generates a response for one Telegram text message and sends it back.
 * If inference fails, the technical error is logged and the user receives a
 * generic failure notice instead (see task 6.4). Both the success and
 * fallback replies are sent through `safeSendTelegramMessage`, which itself
 * catches and logs Telegram API failures (see task 6.5), so neither an
 * inference error nor a Telegram `sendMessage` error can stop the bot from
 * processing subsequent updates.
 */
async function handleTextMessage(
  telegramApiClient: TelegramApiClient,
  inferenceClient: InferenceClient,
  parsedMessage: ParsedTextMessage,
): Promise<void> {
  let responseText: string;
  try {
    responseText = await inferenceClient.generate(parsedMessage.text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown inference error";
    console.error(`Inference request failed for chat ${parsedMessage.chatId}: ${message}`);
    await safeSendTelegramMessage(telegramApiClient, parsedMessage.chatId, INFERENCE_FAILURE_NOTICE);
    return;
  }

  await safeSendTelegramMessage(telegramApiClient, parsedMessage.chatId, responseText);
}

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
    handleTelegramUpdate(update, (parsedMessage) =>
      handleTextMessage(telegramApiClient, inferenceClient, parsedMessage),
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Telegram bot failed to start: ${message}`);
  process.exit(1);
});
