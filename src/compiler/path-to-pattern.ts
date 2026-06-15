export function pathToPattern(segments: string[]): string {
  if (segments.length === 0) return "/";

  const parts = segments.map((segment) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return `:${segment.slice(1, -1)}`;
    }
    return segment;
  });

  return `/${parts.join("/")}`;
}
