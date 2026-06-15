import type { Context } from "../../../../src/shared/types.js";

export function handler(ctx: Context) {
  return ctx.json({
    status: "ok",
  });
}
