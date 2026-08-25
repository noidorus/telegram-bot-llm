import type { TelegramUpdate } from "./updates.ts";

export interface ParsedTextMessage {
  chatId: number;
  text: string;
}

/**
 * Extracts the originating chat ID and text from a Telegram update.
 * Returns `null` when the update has no message or the message has no text
 * (e.g. photo, sticker, or voice messages without a caption).
 */
export function extractTextMessage(update: TelegramUpdate): ParsedTextMessage | null {
  const message = update.message;
  if (!message) {
    return null;
  }

  const text = message.text;
  if (typeof text !== "string" || text.length === 0) {
    return null;
  }

  return { chatId: message.chat.id, text };
}
