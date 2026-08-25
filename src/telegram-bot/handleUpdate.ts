import type { TelegramUpdate } from "./updates.ts";
import { extractTextMessage, type ParsedTextMessage } from "./parseMessage.ts";

export interface TextMessageHandler {
  (parsedMessage: ParsedTextMessage): void | Promise<void>;
}

/**
 * Routes a Telegram update to `onTextMessage` when it contains a valid text
 * message. Updates without a message, or with a message that has no text
 * (photos, stickers, etc.), are ignored: `onTextMessage` is not called and no
 * error is thrown, so such updates never reach the inference layer.
 */
export async function handleTelegramUpdate(update: TelegramUpdate, onTextMessage: TextMessageHandler): Promise<void> {
  const parsedMessage = extractTextMessage(update);
  if (parsedMessage === null) {
    return;
  }

  await onTextMessage(parsedMessage);
}
