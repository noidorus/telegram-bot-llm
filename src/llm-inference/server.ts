import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { InferenceBackendError } from "./errors.ts";
import type { LlmProvider } from "./provider.ts";
import { validateGenerateRequest } from "./validateRequest.ts";

export interface GenerateResponseBody {
  text: string;
}

export type GenerateFunction = LlmProvider["generate"];

export interface LlmInferenceServerOptions {
  host: string;
  port: number;
  provider: LlmProvider;
}

export interface LlmInferenceServer {
  listen(): Promise<void>;
  close(): Promise<void>;
}

export function createLlmInferenceServer(options: LlmInferenceServerOptions): LlmInferenceServer {
  const { host, port, provider } = options;

  const server = createServer((req, res) => {
    handleRequest(req, res, provider).catch((error: unknown) => {
      console.error(
        "Unhandled error while processing request:",
        error instanceof Error ? error.message : "Unknown error",
      );
      if (!res.headersSent) {
        sendJson(res, 500, { error: "Internal server error" });
      } else {
        res.end();
      }
    });
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

async function handleRequest(req: IncomingMessage, res: ServerResponse, provider: LlmProvider): Promise<void> {
  if (req.url !== "/generate") {
    sendJson(res, 404, { error: "Not Found" });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  await handleGenerate(req, res, provider);
}

async function handleGenerate(req: IncomingMessage, res: ServerResponse, provider: LlmProvider): Promise<void> {
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

  const validationResult = validateGenerateRequest(parsedBody);
  if (!validationResult.valid) {
    sendJson(res, 400, { error: validationResult.error });
    return;
  }

  try {
    const text = await provider.generate(validationResult.prompt);
    const responseBody: GenerateResponseBody = { text };
    sendJson(res, 200, responseBody);
  } catch (error) {
    if (error instanceof InferenceBackendError) {
      console.error("LLM inference backend unavailable:", error.message);
      sendJson(res, 502, { error: "Inference backend is unavailable" });
      return;
    }

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

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(payload);
}
