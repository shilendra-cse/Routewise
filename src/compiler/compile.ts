import { pathToFileURL } from "node:url";
import { createRouter } from "../matcher/matcher.js";
import { scan } from "./scan.js";
import type { Router } from "../matcher/type.js";
import { withMiddleware } from "../middleware/run.js";
import { resolveMiddlewareChain } from "../middleware/resolve-middleware-chain.js";
import type { Middleware } from "../shared/types.js";
import type { ScannedMiddleware } from "./type.js";

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

function readSkip(mod: Record<string, unknown>): string[] {
  if (!Array.isArray(mod.skip)) return [];
  return mod.skip.filter((name): name is string => typeof name === "string");
}

function readUse(mod: Record<string, unknown>): Middleware[] {
  if (!Array.isArray(mod.use)) return [];

  for (const entry of mod.use) {
    if (typeof entry !== "function") {
      throw new Error("route use entries must be middleware functions");
    }
  }

  return mod.use;
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

    const skip = readSkip(mod);
    const use = readUse(mod);
    const chain = resolveMiddlewareChain(middlewares, route.segments, skip);
    const loadedMiddlewares: Middleware[] = [];

    for (const entry of chain) {
      loadedMiddlewares.push(
        ...(await loadMiddlewareEntry(entry, middlewareCache)),
      );
    }

    loadedMiddlewares.push(...use);

    const handler = withMiddleware(loadedMiddlewares, mod.handler);
    router.register(route.method, route.pattern, handler);
  }

  return router;
}
