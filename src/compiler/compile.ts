import { pathToFileURL } from "node:url";
import { createRouter } from "../matcher/matcher.js";
import { scan } from "./scan.js";
import type { Router } from "../matcher/type.js";
import { withMiddleware } from "../middleware/run.js";
import { resolveMiddlewareChain } from "../middleware/resolve-middleware-chain.js";
import type { Middleware } from "../shared/types.js";

async function loadMiddleware(
  filePath: string,
  cache: Map<string, Middleware>,
): Promise<Middleware> {
  const cached = cache.get(filePath);
  if (cached) return cached;

  const mod = await import(pathToFileURL(filePath).href);

  if (typeof mod.middleware !== "function") {
    throw new Error(`${filePath} must export middleware`);
  }

  cache.set(filePath, mod.middleware);
  return mod.middleware;
}

export async function compile(resourcesDir: string): Promise<Router> {
  const router = createRouter();
  const { routes, middlewares } = await scan(resourcesDir);
  const middlewareCache = new Map<string, Middleware>();

  for (const route of routes) {
    const mod = await import(pathToFileURL(route.filePath).href);

    if (typeof mod.handler !== "function") {
      throw new Error(`${route.filePath} must export handler`);
    }

    const chain = resolveMiddlewareChain(middlewares, route.segments);
    const loadedMiddlewares = await Promise.all(
      chain.map((entry) => loadMiddleware(entry.filePath, middlewareCache)),
    );

    const handler = withMiddleware(loadedMiddlewares, mod.handler);
    router.register(route.method, route.pattern, handler);
  }

  return router;
}
