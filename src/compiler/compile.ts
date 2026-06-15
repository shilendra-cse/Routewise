import { pathToFileURL } from "node:url";
import { createRouter } from "../matcher/matcher.js";
import { scan } from "./scan.js";
import { Router } from "../matcher/type.js";

export async function compile(resourcesDir: string): Promise<Router> {
  const router = createRouter();
  const routes = await scan(resourcesDir);

  for (const route of routes) {
    const mod = await import(pathToFileURL(route.filePath).href);

    if (typeof mod.handler !== "function") {
      throw new Error(`${route.filePath} must export handler`);
    }

    router.register(route.method, route.pattern, mod.handler);
  }

  return router;
}
