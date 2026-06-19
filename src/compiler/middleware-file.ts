const NAMED_SUFFIX = ".middleware.ts";

export function isNamedMiddlewareFile(fileName: string): boolean {
  return fileName.endsWith(NAMED_SUFFIX);
}

export function isComposerFile(fileName: string): boolean {
  return fileName === "middleware.ts";
}

export function middlewareNameFromFile(fileName: string): string {
  return fileName.slice(0, -NAMED_SUFFIX.length);
}
