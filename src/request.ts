import { IncomingMessage } from "node:http";

export type ParsedRequest = {
  method: string;
  path: string;
  query: Record<string, string>;
  host: string;
};

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
