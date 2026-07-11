function isCatchAllSegment(segment: string): boolean {
  return segment.startsWith("[...") && segment.endsWith("]");
}

function isDynamicSegment(segment: string): boolean {
  return (
    segment.startsWith("[") &&
    segment.endsWith("]") &&
    !isCatchAllSegment(segment)
  );
}

export function pathToPattern(segments: string[]): string {
  if (segments.length === 0) return "/";

  for (let i = 0; i < segments.length; i++) {
    if (isCatchAllSegment(segments[i]) && i !== segments.length - 1) {
      throw new Error(
        `Catch-all segment "${segments[i]}" must be the last folder in the path`,
      );
    }
  }

  const parts = segments.map((segment) => {
    if (isCatchAllSegment(segment)) {
      return `*${segment.slice(4, -1)}`;
    }
    if (isDynamicSegment(segment)) {
      return `:${segment.slice(1, -1)}`;
    }
    return segment;
  });

  return `/${parts.join("/")}`;
}
