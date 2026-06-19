import type { Middleware } from "routewise";

export const methods = ["GET", "POST"];

export const middleware: Middleware = async (ctx, next) => {
  console.log(`specific middleware - before (${ctx.method})`);
  await next();
  console.log(`specific middleware - after (${ctx.method})`);
};
