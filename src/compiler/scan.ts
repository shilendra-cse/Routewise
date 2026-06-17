import path from "node:path";
import { ScannedMiddleware, ScannedRoute, ScanResult } from "./type.js";
import { readdir } from "node:fs/promises";
import { fileToMethod } from "./file-to-method.js";
import { pathToPattern } from "./path-to-pattern.js";

export async function scan(resourcesDir: string): Promise<ScanResult> {
  const absoluteRoot = path.resolve(resourcesDir);
  const routes: ScannedRoute[] = [];
  const middlewares: ScannedMiddleware[] = [];

  async function walk(currentDir: string, segments: string[]) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, [...segments, entry.name]);
        continue;
      }

      if (!entry.isFile()) continue;

      if (entry.name === "middleware.ts") {
        middlewares.push({ filePath: fullPath, segments });
        continue;
      }

      const method = fileToMethod(entry.name);
      if (method === null) continue;

      routes.push({
        filePath: fullPath,
        method,
        pattern: pathToPattern(segments),
        segments,
      });
    }
  }

  await walk(absoluteRoot, []);
  return { routes, middlewares };
}
