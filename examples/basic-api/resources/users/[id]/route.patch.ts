import type { Context } from "routewise";

export const skip = ["auth"];

export function handler(ctx: Context) {
  return ctx.json({ patched: true, id: ctx.params.id });
}
