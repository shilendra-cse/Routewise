import { Handler } from "../shared/types.js";
import { MatchResult, Route } from "./type.js";
import { matchSegments } from "./utils/matchSegments.js";

export function createRouter() {
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

    for (const route of routes) {
      if (route.method !== method) continue;
      const params = matchSegments(route.segments, pathSegments);
      if (params !== null)
        return {
          handler: route.handler,
          params,
        };
    }

    return null;
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
  };
}
