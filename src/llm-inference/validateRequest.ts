export type ValidateGenerateRequestResult =
  | { valid: true; prompt: string }
  | { valid: false; error: string };

export function validateGenerateRequest(body: unknown): ValidateGenerateRequestResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  if (!("prompt" in body)) {
    return { valid: false, error: "Missing required field: prompt" };
  }

  const prompt = (body as { prompt: unknown }).prompt;

  if (typeof prompt !== "string") {
    return { valid: false, error: "Field prompt must be a string" };
  }

  if (prompt.trim().length === 0) {
    return { valid: false, error: "Field prompt must not be empty" };
  }

  return { valid: true, prompt };
}
