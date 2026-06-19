import { Handler, Middleware, Context } from "../shared/types.js";

async function runMiddlewareChain(
  middlewares: Middleware[],
  ctx: Context,
  handler: Handler,
): Promise<void> {
  let i = 0;
  async function next() {
    if (i < middlewares.length) {
      await middlewares[i++](ctx, next);
    } else {
      await handler(ctx);
    }
  }
  await next();
}

export function withMiddleware(
  middlewares: Middleware[],
  handler: Handler,
): Handler {
  return (ctx) => runMiddlewareChain(middlewares, ctx, handler);
}
