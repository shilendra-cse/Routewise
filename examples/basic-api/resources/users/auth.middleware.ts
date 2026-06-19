import type { Middleware } from "routewise";

export const middleware: Middleware = async (ctx, next) => {
  if (!ctx.headers.authorization) {
    return ctx.unauthorized();
  }
  await next();
};
