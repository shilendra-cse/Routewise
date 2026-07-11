/** Higher score = more specific. Static > dynamic > catch-all. */
export function routeSpecificity(segments: string[]): number {
  let score = 0;

  for (const segment of segments) {
    if (segment.startsWith("*")) {
      score += 0;
    } else if (segment.startsWith(":")) {
      score += 1;
    } else {
      score += 10;
    }
  }

  return score;
}
