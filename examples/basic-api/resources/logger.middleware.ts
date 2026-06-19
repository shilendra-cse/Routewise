import type { Middleware } from "routewise";

export const middleware: Middleware = async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.path}`);
  await next();
  console.log(`hi this is logger middleware-after handler`);
};
