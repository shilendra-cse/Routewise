const METHOD_MAP: Record<string, string> = {
  "route.get.ts": "GET",
  "route.post.ts": "POST",
  "route.put.ts": "PUT",
  "route.patch.ts": "PATCH",
  "route.delete.ts": "DELETE",
};

export function fileToMethod(fileName: string): string | null {
  return METHOD_MAP[fileName] ?? null;
}
