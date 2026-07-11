export function matchSegments(
  routeSegments: string[],
  pathSegments: string[],
): Record<string, string> | null {
  const params: Record<string, string> = {};

  for (let i = 0; i < routeSegments.length; i++) {
    const routePart = routeSegments[i];

    if (routePart.startsWith("*")) {
      if (i !== routeSegments.length - 1) return null;

      const rest = pathSegments.slice(i);
      if (rest.length === 0) return null;

      params[routePart.slice(1)] = rest.join("/");
      return params;
    }

    if (i >= pathSegments.length) return null;

    const pathPart = pathSegments[i];

    if (routePart.startsWith(":")) {
      params[routePart.slice(1)] = pathPart;
    } else if (routePart !== pathPart) {
      return null;
    }
  }

  if (routeSegments.length !== pathSegments.length) return null;

  return params;
}
