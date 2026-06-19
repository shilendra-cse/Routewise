import { pathToFileURL } from "node:url";
import { createRouter } from "../matcher/matcher.js";
import { scan } from "./scan.js";
import type { Router } from "../matcher/type.js";
import { withMiddleware } from "../middleware/run.js";
import type { Middleware } from "../shared/types.js";
import type { ScannedMiddleware } from "./type.js";
import { loadMiddlewareMeta } from "./middleware-meta.js";
import { buildRouteMiddlewareChain } from "./build-route-middleware-chain.js";
import { parseUse, readSkip } from "./route-exports.js";

async function loadNamedMiddleware(
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

async function loadComposerMiddleware(
  filePath: string,
): Promise<Middleware[]> {
  const mod = await import(pathToFileURL(filePath).href);

  if (!Array.isArray(mod.middleware)) {
    throw new Error(`${filePath} composer must export middleware as an array`);
  }

  for (const entry of mod.middleware) {
    if (typeof entry !== "function") {
      throw new Error(`${filePath} composer middleware entries must be functions`);
    }
  }

  return mod.middleware;
}

async function loadMiddlewareEntry(
  entry: ScannedMiddleware,
  cache: Map<string, Middleware>,
): Promise<Middleware[]> {
  if (entry.kind === "composer") {
    return loadComposerMiddleware(entry.filePath);
  }

  return [await loadNamedMiddleware(entry.filePath, cache)];
}

export async function compile(resourcesDir: string): Promise<Router> {
  const router = createRouter();
  const { routes, middlewares } = await scan(resourcesDir);
  const middlewareCache = new Map<string, Middleware>();
  const metaCache = new Map<
    string,
    Awaited<ReturnType<typeof loadMiddlewareMeta>>
  >();

  for (const route of routes) {
    const mod = await import(pathToFileURL(route.filePath).href);

    if (typeof mod.handler !== "function") {
      throw new Error(`${route.filePath} must export handler`);
    }

    const skip = readSkip(mod);
    const { names: useNames, functions: useFunctions } = parseUse(
      mod,
      route.filePath,
    );
    const chain = await buildRouteMiddlewareChain(
      middlewares,
      route,
      skip,
      useNames,
      metaCache,
    );
    const loadedMiddlewares: Middleware[] = [];

    for (const entry of chain) {
      loadedMiddlewares.push(
        ...(await loadMiddlewareEntry(entry, middlewareCache)),
      );
    }

    loadedMiddlewares.push(...useFunctions);

    const handler = withMiddleware(loadedMiddlewares, mod.handler);
    router.register(route.method, route.pattern, handler);
  }

  return router;
}
