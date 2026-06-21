import type { IncomingMessage } from "node:http";
import type { Context } from "../shared/types.js";

export const DEFAULT_BODY_LIMIT = 1_048_576;

export class BodyTooLargeError extends Error {
  override name = "BodyTooLargeError";
}

// Only read when there's actually a body — avoids hanging on GET
export function shouldReadBody(req: IncomingMessage): boolean {
  const length = req.headers["content-length"];
  if (length === "0") return false;
  if (length !== undefined && Number(length) > 0) return true;
  return req.headers["transfer-encoding"]?.toLowerCase().includes("chunked") ?? false;
}

export async function readRequestBody(req: IncomingMessage, limit: number): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    size += buffer.length;
    if (size > limit) throw new BodyTooLargeError();
    chunks.push(buffer);
  }

  return chunks.length === 0 ? "" : Buffer.concat(chunks).toString("utf8");
}

export async function populateBody(
  req: IncomingMessage,
  ctx: Context,
  limit: number,
): Promise<"ok" | "too-large" | "invalid-json"> {
  if (!shouldReadBody(req)) return "ok";

  try {
    const raw = await readRequestBody(req, limit);
    ctx.rawBody = raw;

    if (!raw) return "ok";

    const contentType = ctx.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
    if (contentType !== "application/json") return "ok";

    try {
      ctx.body = JSON.parse(raw);
    } catch {
      return "invalid-json";
    }

    return "ok";
  } catch (error) {
    if (error instanceof BodyTooLargeError) return "too-large";
    throw error;
  }
}