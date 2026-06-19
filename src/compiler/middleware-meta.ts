import { pathToFileURL } from "node:url";

export type MiddlewareMeta = {
  methods?: string[];
  inherit: boolean;
};

function readMethods(mod: Record<string, unknown>): string[] | undefined {
  if (!Array.isArray(mod.methods)) return undefined;

  const methods: string[] = [];
  for (const method of mod.methods) {
    if (typeof method !== "string") {
      throw new Error("middleware methods entries must be strings");
    }
    methods.push(method.toUpperCase());
  }

  return methods;
}

function readInherit(mod: Record<string, unknown>): boolean {
  if (mod.inherit === false) return false;
  return true;
}

export async function loadMiddlewareMeta(
  filePath: string,
  cache: Map<string, MiddlewareMeta>,
): Promise<MiddlewareMeta> {
  const cached = cache.get(filePath);
  if (cached) return cached;

  const mod = await import(pathToFileURL(filePath).href);
  const meta: MiddlewareMeta = {
    methods: readMethods(mod),
    inherit: readInherit(mod),
  };

  cache.set(filePath, meta);
  return meta;
}
