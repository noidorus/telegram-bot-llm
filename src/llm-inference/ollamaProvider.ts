import { InferenceBackendError } from "./errors.ts";
import type { LlmProvider } from "./provider.ts";

interface OllamaGenerateResponse {
  response?: unknown;
}

function isOllamaGenerateResponse(value: unknown): value is OllamaGenerateResponse {
  return typeof value === "object" && value !== null;
}

export interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
}

/**
 * LLM provider backed by a local Ollama server. Implements `LlmProvider` so
 * the inference service can depend only on the abstraction, not on Ollama.
 */
export function createOllamaProvider(options: OllamaProviderOptions): LlmProvider {
  const { baseUrl, model } = options;

  async function generate(prompt: string): Promise<string> {
    const url = `${baseUrl}/api/generate`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, prompt, stream: false }),
      });
    } catch (error) {
      const cause = error instanceof Error ? error.message : "Unknown network error";
      throw new InferenceBackendError(`Failed to reach Ollama backend: ${cause}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new InferenceBackendError(
        `Ollama backend returned an error: ${response.status} ${response.statusText}${
          errorText ? ` - ${errorText}` : ""
        }`,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      const cause = error instanceof Error ? error.message : "Unknown parsing error";
      throw new InferenceBackendError(`Failed to parse Ollama response: ${cause}`);
    }

    if (!isOllamaGenerateResponse(payload) || typeof payload.response !== "string") {
      throw new InferenceBackendError("Ollama response did not contain a valid \"response\" field");
    }

    return payload.response;
  }

  return { generate };
}
