import type { Context } from "routewise";

export const skip = ["auth"];

export function handler(ctx: Context) {
  const body = ctx.body as { name?: string } | undefined;
  return ctx.status(201).json({ id: ctx.params.id, name: body?.name ?? null });
}
