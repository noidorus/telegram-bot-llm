export interface InferenceClientOptions {
  baseUrl: string;
}

export interface InferenceClient {
  generate(prompt: string): Promise<string>;
}

interface GenerateResponseBody {
  text?: unknown;
  error?: unknown;
}

function isGenerateResponseBody(value: unknown): value is GenerateResponseBody {
  return typeof value === "object" && value !== null;
}

/**
 * Minimal HTTP client for the LLM inference API's `POST /generate` endpoint.
 * Failures (network errors, non-2xx status, or an unexpected response shape)
 * are surfaced as a thrown `Error`; the caller is responsible for handling
 * inference failures (see task 6.4).
 */
export function createInferenceClient(options: InferenceClientOptions): InferenceClient {
  const { baseUrl } = options;

  async function generate(prompt: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
    } catch {
      throw new Error("Failed to reach LLM inference service: network request failed");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Failed to parse LLM inference service response");
    }

    if (!response.ok) {
      const errorMessage =
        isGenerateResponseBody(payload) && typeof payload.error === "string" ? payload.error : "Unknown error";
      throw new Error(`LLM inference service returned an error (${response.status}): ${errorMessage}`);
    }

    if (!isGenerateResponseBody(payload) || typeof payload.text !== "string") {
      throw new Error("Unexpected LLM inference service response shape");
    }

    return payload.text;
  }

  return { generate };
}
