import type { ScannedMiddleware, ScannedRoute } from "./type.js";
import { loadMiddlewareMeta } from "./middleware-meta.js";
import { findNamedMiddleware } from "../middleware/find-named-middleware.js";
import { resolveMiddlewareChain } from "../middleware/resolve-middleware-chain.js";

function appliesToMethod(
  meta: { methods?: string[] },
  method: string,
): boolean {
  if (!meta.methods) return true;
  return meta.methods.includes(method);
}

function appendUnique(
  chain: ScannedMiddleware[],
  seen: Set<string>,
  entry: ScannedMiddleware,
): void {
  if (seen.has(entry.filePath)) return;
  seen.add(entry.filePath);
  chain.push(entry);
}

export async function buildRouteMiddlewareChain(
  all: ScannedMiddleware[],
  route: ScannedRoute,
  skip: string[],
  useNames: string[],
  metaCache: Map<
    string,
    Awaited<ReturnType<typeof loadMiddlewareMeta>>
  >,
): Promise<ScannedMiddleware[]> {
  const inherited = resolveMiddlewareChain(all, route.segments, skip);
  const chain: ScannedMiddleware[] = [];
  const seen = new Set<string>();

  for (const entry of inherited) {
    const meta = await loadMiddlewareMeta(entry.filePath, metaCache);
    if (!meta.inherit) continue;
    if (!appliesToMethod(meta, route.method)) continue;
    appendUnique(chain, seen, entry);
  }

  const skipSet = new Set(skip);

  for (const name of useNames) {
    if (skipSet.has(name)) continue;

    const entry = findNamedMiddleware(all, route.segments, name);
    if (!entry) {
      throw new Error(
        `Middleware "${name}" not found in ${route.segments.join("/") || "resources root"} (referenced from ${route.filePath})`,
      );
    }

    appendUnique(chain, seen, entry);
  }

  return chain;
}
