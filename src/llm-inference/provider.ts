/**
 * Provider-independent abstraction for generating text responses from a
 * locally hosted language model. The inference service depends only on
 * this interface, not on a specific backend (e.g. Ollama).
 */
export interface LlmProvider {
  generate(prompt: string): Promise<string>;
}
