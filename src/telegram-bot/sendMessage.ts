import type { TelegramApiClient } from "./telegramApi.ts";

export async function sendTelegramMessage(client: TelegramApiClient, chatId: number, text: string): Promise<void> {
  await client.callMethod("sendMessage", { chat_id: chatId, text });
}
