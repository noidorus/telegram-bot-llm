import { loadTelegramBotConfig, type TelegramBotConfig } from "./config.ts";
import { createInferenceClient, type InferenceClient } from "./inferenceClient.ts";
import { handleTelegramUpdate } from "./handleUpdate.ts";
import type { ParsedTextMessage } from "./parseMessage.ts";
import { sendTelegramMessage } from "./sendMessage.ts";
import { createTelegramApiClient, type TelegramApiClient } from "./telegramApi.ts";
import { pollUpdates } from "./updates.ts";

const INFERENCE_FAILURE_NOTICE = "Не удалось получить ответ от модели. Попробуйте ещё раз позже.";

/**
 * Generates a response for one Telegram text message and sends it back.
 * If inference fails, the technical error is logged and the user receives a
 * generic failure notice instead (see task 6.4); the caller (`pollUpdates`)
 * is never reached by an inference error, so a single failed message cannot
 * stop the bot from processing subsequent updates.
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

    try {
      await sendTelegramMessage(telegramApiClient, parsedMessage.chatId, INFERENCE_FAILURE_NOTICE);
    } catch (sendError) {
      const sendErrorMessage = sendError instanceof Error ? sendError.message : "Unknown error";
      console.error(
        `Failed to send inference failure notice to chat ${parsedMessage.chatId}: ${sendErrorMessage}`,
      );
    }
    return;
  }

  await sendTelegramMessage(telegramApiClient, parsedMessage.chatId, responseText);
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
