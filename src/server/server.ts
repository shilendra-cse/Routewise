import * as http from "node:http";
import { createContext } from "../context/context.js";
import { createRouter } from "../matcher/matcher.js";

export function createRoutewiseServer() {
  const router = createRouter();
  router.get("/health", (ctx) => ctx.json({ status: "ok" }));
  router.get("/users/:id", (ctx) =>
    ctx.json({
      id: ctx.params.id,
    }),
  );

  const server = http.createServer(async (req, res) => {
    const ctx = createContext(req, res);
    const result = router.match(ctx.method, ctx.path);

    if (!result) return ctx.notFound();

    ctx.params = result.params;

    try {
      await result.handler(ctx);
    } catch {
      if (!res.headersSent)
        ctx.status(500).json({
          error: "Internal Server Error",
        });
    }
  });

  return server;
}
