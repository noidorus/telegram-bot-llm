const DEFAULT_BASE_URL = "https://api.telegram.org";

export class TelegramApiError extends Error {
  readonly errorCode: number;
  readonly description: string;

  constructor(errorCode: number, description: string) {
    super(`Telegram API error ${errorCode}: ${description}`);
    this.name = "TelegramApiError";
    this.errorCode = errorCode;
    this.description = description;
  }
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

function isTelegramApiResponse(value: unknown): value is TelegramApiResponse<unknown> {
  return typeof value === "object" && value !== null && "ok" in value && typeof (value as { ok: unknown }).ok === "boolean";
}

export interface TelegramApiClientOptions {
  botToken: string;
  baseUrl?: string;
}

export interface TelegramApiClient {
  callMethod<T>(method: string, params?: Record<string, unknown>): Promise<T>;
}

export function createTelegramApiClient(options: TelegramApiClientOptions): TelegramApiClient {
  const { botToken } = options;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  async function callMethod<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const url = `${baseUrl}/bot${botToken}/${method}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params ?? {}),
      });
    } catch {
      throw new Error(`Failed to reach Telegram API method "${method}": network request failed`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`Failed to parse Telegram API response for method "${method}"`);
    }

    if (!isTelegramApiResponse(payload)) {
      throw new Error(`Unexpected Telegram API response shape for method "${method}"`);
    }

    if (!payload.ok) {
      throw new TelegramApiError(
        payload.error_code ?? response.status,
        payload.description ?? "Unknown Telegram API error",
      );
    }

    return payload.result as T;
  }

  return { callMethod };
}
