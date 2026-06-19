import type { ScannedMiddleware } from "../compiler/type.js";

function segmentKey(segments: string[]): string {
  return segments.join("/");
}

export function findNamedMiddleware(
  all: ScannedMiddleware[],
  segments: string[],
  name: string,
): ScannedMiddleware | undefined {
  const key = segmentKey(segments);

  return all.find(
    (entry) =>
      entry.kind === "named" &&
      segmentKey(entry.segments) === key &&
      entry.name === name,
  );
}
