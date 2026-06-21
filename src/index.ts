import { compile } from "./compiler/compile.js";
import { createRoutewiseServer } from "./server/server.js";
import { RoutewiseOptions } from "./shared/types.js";

export type {
  Context,
  Handler,
  Middleware,
  RoutewiseOptions,
} from "./shared/types.js";
export type { MiddlewareMeta } from "./compiler/middleware-meta.js";
export type { RouteUseEntry } from "./shared/route-use.js";

// Public - Front Door
export async function routewise(options?: RoutewiseOptions) {
  const router = await compile(options?.resourcesDir ?? "./resources");
  const server = createRoutewiseServer(router, {
    bodyLimit: options?.bodyLimit,
  });
  return {
    listen(port: number) {
      server.listen(port, () => {
        console.log(`Routewise listening on port ${port}`);
      });
    },
  };
}
