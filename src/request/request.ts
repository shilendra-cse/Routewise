import { IncomingMessage } from "node:http";
import { ParsedRequest } from "./type.js";

function normalizeHeaders(
  headers: IncomingMessage["headers"],
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    result[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  return result;
}

export function parseRequest(req: IncomingMessage): ParsedRequest {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);

  return {
    method: req.method ?? "GET",
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    host,
    headers: normalizeHeaders(req.headers),
  };
}
