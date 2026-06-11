import { IncomingMessage } from "node:http";
import { ParsedRequest } from "./type.js";

export function parseRequest(req: IncomingMessage): ParsedRequest {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);

  return {
    method: req.method ?? "GET",
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    host: host,
  };
}
