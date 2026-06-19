import { compile } from "./compiler/compile.js";
import { createRoutewiseServer } from "./server/server.js";

export type { Context, Handler, Middleware } from "./shared/types.js";
export type { MiddlewareMeta } from "./compiler/middleware-meta.js";
export type { RouteUseEntry } from "./shared/route-use.js";

// Public - Front Door
export async function routewise(options?: { resourcesDir?: string }) {
  const router = await compile(options?.resourcesDir ?? "./resources");
  const server = createRoutewiseServer(router);
  return {
    listen(port: number) {
      server.listen(port, () => {
        console.log(`Routewise listening on port ${port}`);
      });
    },
  };
}
