import { ScannedMiddleware } from "../compiler/type.js";

export function resolveMiddlewareChain(
  all: ScannedMiddleware[],
  routeSegments: string[],
): ScannedMiddleware[] {
  return all
    .filter(
      (m) =>
        m.segments.length <= routeSegments.length &&
        m.segments.every((seg, i) => seg === routeSegments[i]),
    )
    .sort((a, b) => a.segments.length - b.segments.length);
}
