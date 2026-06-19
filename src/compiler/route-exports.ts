import type { Middleware } from "../shared/types.js";

export function readSkip(mod: Record<string, unknown>): string[] {
  if (!Array.isArray(mod.skip)) return [];
  return mod.skip.filter((name): name is string => typeof name === "string");
}

export type ParsedUse = {
  names: string[];
  functions: Middleware[];
};

export function parseUse(
  mod: Record<string, unknown>,
  routeFilePath: string,
): ParsedUse {
  if (!Array.isArray(mod.use)) return { names: [], functions: [] };

  const names: string[] = [];
  const functions: Middleware[] = [];

  for (const entry of mod.use) {
    if (typeof entry === "string") {
      names.push(entry);
      continue;
    }

    if (typeof entry === "function") {
      functions.push(entry);
      continue;
    }

    throw new Error(
      `${routeFilePath} use entries must be middleware names (strings) or functions`,
    );
  }

  return { names, functions };
}
