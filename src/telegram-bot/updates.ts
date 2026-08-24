import type { TelegramApiClient } from "./telegramApi.ts";

export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const DEFAULT_TIMEOUT_SECONDS = 30;

export interface PollUpdatesOptions {
  timeoutSeconds?: number;
}

/**
 * Requests a single batch of updates from Telegram starting at `offset`.
 * Network/API failures are caught and logged so the caller's polling loop
 * can continue without losing the current offset.
 */
export async function fetchUpdates(
  client: TelegramApiClient,
  offset: number | undefined,
  timeoutSeconds: number,
): Promise<TelegramUpdate[]> {
  try {
    const params: Record<string, unknown> = { timeout: timeoutSeconds };
    if (offset !== undefined) {
      params.offset = offset;
    }

    return await client.callMethod<TelegramUpdate[]>("getUpdates", params);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to fetch Telegram updates: ${message}`);
    return [];
  }
}

/**
 * Computes the next offset to request, given the previous offset and the
 * updates received in the last batch. Telegram treats updates as confirmed
 * once `offset` exceeds their `update_id`, so the next offset must be
 * `max(update_id) + 1` across the received batch.
 */
export function nextOffset(previousOffset: number | undefined, updates: readonly TelegramUpdate[]): number | undefined {
  if (updates.length === 0) {
    return previousOffset;
  }

  const maxUpdateId = updates.reduce((max, update) => Math.max(max, update.update_id), updates[0].update_id);
  return maxUpdateId + 1;
}

/**
 * Runs an infinite Telegram long-polling loop, invoking `onUpdate` for each
 * received update. Errors thrown while fetching updates or while handling an
 * individual update are caught and logged so the loop keeps running.
 */
export async function pollUpdates(
  client: TelegramApiClient,
  onUpdate: (update: TelegramUpdate) => void | Promise<void>,
  options?: PollUpdatesOptions,
): Promise<never> {
  const timeoutSeconds = options?.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
  let offset: number | undefined;

  for (;;) {
    const updates = await fetchUpdates(client, offset, timeoutSeconds);

    for (const update of updates) {
      try {
        await onUpdate(update);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to process Telegram update ${update.update_id}: ${message}`);
      }
    }

    offset = nextOffset(offset, updates);
  }
}
