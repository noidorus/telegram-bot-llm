import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export interface GenerateResponseBody {
  text: string;
}

export type GenerateFunction = (prompt: string) => Promise<string>;

export interface LlmInferenceServerOptions {
  host: string;
  port: number;
  generate: GenerateFunction;
}

export interface LlmInferenceServer {
  listen(): Promise<void>;
  close(): Promise<void>;
}

export function createLlmInferenceServer(options: LlmInferenceServerOptions): LlmInferenceServer {
  const { host, port, generate } = options;

  const server = createServer((req, res) => {
    void handleRequest(req, res, generate);
  });

  return {
    listen(): Promise<void> {
      return new Promise((resolve) => {
        server.listen(port, host, resolve);
      });
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, generate: GenerateFunction): Promise<void> {
  if (req.url !== "/generate") {
    sendJson(res, 404, { error: "Not Found" });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  await handleGenerate(req, res, generate);
}

async function handleGenerate(req: IncomingMessage, res: ServerResponse, generate: GenerateFunction): Promise<void> {
  let rawBody: string;
  try {
    rawBody = await readRequestBody(req);
  } catch {
    sendJson(res, 400, { error: "Failed to read request body" });
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = rawBody.length > 0 ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const prompt = extractPrompt(parsedBody);
  if (prompt === undefined) {
    sendJson(res, 400, { error: "Missing required field: prompt" });
    return;
  }

  try {
    const text = await generate(prompt);
    const responseBody: GenerateResponseBody = { text };
    sendJson(res, 200, responseBody);
  } catch (error) {
    console.error("LLM generation failed:", error instanceof Error ? error.message : "Unknown error");
    sendJson(res, 500, { error: "Failed to generate response" });
  }
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function extractPrompt(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("prompt" in value)) {
    return undefined;
  }

  const prompt = (value as { prompt: unknown }).prompt;
  return typeof prompt === "string" ? prompt : undefined;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(payload);
}
