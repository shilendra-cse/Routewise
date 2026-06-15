import path from "node:path";
import { ScannedRoute } from "./type.js";
import { readdir } from "node:fs/promises";
import { fileToMethod } from "./file-to-method.js";
import { pathToPattern } from "./path-to-pattern.js";

export async function scan(resourcesDir: string): Promise<ScannedRoute[]> {
  const absoluteRoot = path.resolve(resourcesDir);
  const results: ScannedRoute[] = [];

  async function walk(currentDir: string, segments: string[]) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, [...segments, entry.name]);
        continue;
      }

      if (!entry.isFile()) continue;

      const method = fileToMethod(entry.name);
      if (method === null) continue;

      results.push({
        filePath: fullPath,
        method,
        pattern: pathToPattern(segments),
      });
    }
  }

  await walk(absoluteRoot, []);
  return results;
}
