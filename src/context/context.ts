import type { IncomingMessage, ServerResponse } from "node:http";
import { parseRequest } from "../request/request.js";

export function createContext(req: IncomingMessage, res: ServerResponse) {
  const { method, path, query, headers } = parseRequest(req);

  const ctx = {
    _req: req,
    _res: res,
    method,
    path,
    query,
    headers,
    params: {} as Record<string, string>,
    _status: 200,

    status(code: number) {
      ctx._status = code;
      return ctx;
    },

    json(data: unknown) {
      res.statusCode = ctx._status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(data));
    },

    notFound() {
      res.statusCode = 404;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Not Found" }));
    },

    unauthorized(message = "unauthorized") {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: message }));
    },

    badRequest(message = "bad request") {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: message }));
    },
  };

  return ctx;
}
