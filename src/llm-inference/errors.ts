/**
 * Thrown by an LLM provider (e.g. Ollama) when the configured inference
 * backend cannot be reached or fails to respond. Distinguishing this from
 * other errors lets the HTTP layer return a more specific status code.
 */
export class InferenceBackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InferenceBackendError";
  }
}
