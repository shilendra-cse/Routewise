import type { Context } from "routewise";

export function handler(ctx: Context) {
  return ctx.json({ path: ctx.params.path });
}
