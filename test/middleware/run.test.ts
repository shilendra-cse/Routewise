import assert from "node:assert/strict";
import { test } from "node:test";
import { withMiddleware } from "../../src/middleware/run.js";
import type { Context, Middleware } from "../../src/shared/types.js";

const fakeCtx = () => ({}) as Context;

test("runs middleware then handler in onion order", async () => {
  const order: string[] = [];

  const a: Middleware = async (_ctx, next) => {
    order.push("a:before");
    await next();
    order.push("a:after");
  };
  const b: Middleware = async (_ctx, next) => {
    order.push("b:before");
    await next();
    order.push("b:after");
  };

  const handler = withMiddleware([a, b], () => {
    order.push("handler");
  });

  await handler(fakeCtx());

  assert.deepEqual(order, [
    "a:before",
    "b:before",
    "handler",
    "b:after",
    "a:after",
  ]);
});

test("short-circuits when middleware does not call next", async () => {
  const order: string[] = [];

  const guard: Middleware = async () => {
    order.push("guard");
    // intentionally does not call next()
  };

  const handler = withMiddleware([guard], () => {
    order.push("handler");
  });

  await handler(fakeCtx());

  assert.deepEqual(order, ["guard"]);
});

test("runs the handler directly with an empty chain", async () => {
  let ran = false;
  const handler = withMiddleware([], () => {
    ran = true;
  });

  await handler(fakeCtx());
  assert.equal(ran, true);
});
