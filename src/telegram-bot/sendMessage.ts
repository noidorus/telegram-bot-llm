import type { TelegramApiClient } from "./telegramApi.ts";

export async function sendTelegramMessage(client: TelegramApiClient, chatId: number, text: string): Promise<void> {
  await client.callMethod("sendMessage", { chat_id: chatId, text });
}

/**
 * Sends a Telegram message and swallows any Telegram API failure after
 * logging it with chat context, so a failed delivery never propagates as an
 * unhandled rejection. This keeps every call site of `sendMessage` resilient
 * to Telegram API failures without terminating the polling loop (task 6.5).
 */
export async function safeSendTelegramMessage(client: TelegramApiClient, chatId: number, text: string): Promise<void> {
  try {
    await sendTelegramMessage(client, chatId, text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send Telegram message to chat ${chatId}: ${message}`);
  }
}
