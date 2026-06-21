import * as http from "node:http";
import { createContext } from "../context/context.js";
import type { Router } from "../matcher/type.js";
import type { ServerOptions } from "../shared/types.js";
import { DEFAULT_BODY_LIMIT, populateBody } from "../request/parse-body.js";

export function createRoutewiseServer(
  router: Router,
  options: ServerOptions = {},
) {
  const { bodyLimit = DEFAULT_BODY_LIMIT } = options;
  const server = http.createServer(async (req, res) => {
    const ctx = createContext(req, res);
    const result = router.match(ctx.method, ctx.path);

    if (!result) return ctx.notFound();

    ctx.params = result.params;

    const bodyResult = await populateBody(req, ctx, bodyLimit);
    if (bodyResult === "too-large") {
      return ctx.status(413).json({ error: "Payload too large" });
    }
    if (bodyResult === "invalid-json") return ctx.badRequest("Invalid JSON");

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
