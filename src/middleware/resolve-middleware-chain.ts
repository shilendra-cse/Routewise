import { ScannedMiddleware } from "../compiler/type.js";

type MiddlewareGroup = {
  composer?: ScannedMiddleware;
  named: ScannedMiddleware[];
};

function segmentKey(segments: string[]): string {
  return segments.join("/");
}

function segmentLevels(routeSegments: string[]): string[][] {
  const levels: string[][] = [[]];

  for (let i = 0; i < routeSegments.length; i++) {
    levels.push(routeSegments.slice(0, i + 1));
  }

  return levels;
}

function groupByScope(
  middlewares: ScannedMiddleware[],
): Map<string, MiddlewareGroup> {
  const groups = new Map<string, MiddlewareGroup>();

  for (const entry of middlewares) {
    const key = segmentKey(entry.segments);
    const group = groups.get(key) ?? { named: [] };

    if (entry.kind === "composer") {
      group.composer = entry;
    } else {
      group.named.push(entry);
    }

    groups.set(key, group);
  }

  for (const group of groups.values()) {
    group.named.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}

export function resolveMiddlewareChain(
  all: ScannedMiddleware[],
  routeSegments: string[],
  skip: string[] = [],
): ScannedMiddleware[] {
  const groups = groupByScope(all);
  const skipSet = new Set(skip);
  const chain: ScannedMiddleware[] = [];

  for (const level of segmentLevels(routeSegments)) {
    const group = groups.get(segmentKey(level));
    if (!group) continue;

    if (group.composer) {
      chain.push(group.composer);
      continue;
    }

    for (const entry of group.named) {
      if (!skipSet.has(entry.name)) {
        chain.push(entry);
      }
    }
  }

  return chain;
}
