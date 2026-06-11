import * as http from "node:http";
import { createContext } from "./context.js";
const PORT = 3000;

export function createRoutewiseServer() {
  const server = http.createServer((req, res) => {
    const ctx = createContext(req, res);

    if (ctx.method === "GET" && ctx.path === "/health") {
      return ctx.json({ status: "ok" });
    }

    return ctx.notFound();
  });

  return server;
}
