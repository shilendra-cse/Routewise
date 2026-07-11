import { Handler } from "../shared/types.js";
import { matchSegments } from "./utils/matchSegments.js";
import { routeSpecificity } from "./utils/routeSpecificity.js";
import type { MatchResult, Route, Router } from "./type.js";

export function createRouter(): Router {
  const routes: Route[] = [];

  function register(method: string, pattern: string, handler: Handler) {
    routes.push({
      method,
      pattern,
      segments: pattern.split("/").filter(Boolean),
      handler,
    });
  }

  function match(method: string, path: string): MatchResult | null {
    const pathSegments = path.split("/").filter(Boolean);
    let best: { route: Route; params: Record<string, string> } | null = null;

    for (const route of routes) {
      if (route.method !== method) continue;

      const params = matchSegments(route.segments, pathSegments);
      if (params === null) continue;

      if (
        !best ||
        routeSpecificity(route.segments) > routeSpecificity(best.route.segments)
      ) {
        best = { route, params };
      }
    }

    if (!best) return null;

    return {
      handler: best.route.handler,
      params: best.params,
    };
  }

  function allowedMethods(path: string): string[] {
    const pathSegments = path.split("/").filter(Boolean);
    const methods = new Set<string>();

    for (const route of routes) {
      if (matchSegments(route.segments, pathSegments) !== null) {
        methods.add(route.method);
      }
    }

    return [...methods].sort();
  }

  return {
    get: (pattern: string, handler: Handler) =>
      register("GET", pattern, handler),
    post: (pattern: string, handler: Handler) =>
      register("POST", pattern, handler),
    put: (pattern: string, handler: Handler) =>
      register("PUT", pattern, handler),
    patch: (pattern: string, handler: Handler) =>
      register("PATCH", pattern, handler),
    delete: (pattern: string, handler: Handler) =>
      register("DELETE", pattern, handler),
    match,
    allowedMethods,
    register,
  };
}
