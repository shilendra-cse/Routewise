import assert from "node:assert/strict";
import { test } from "node:test";
import { createRouter } from "../../src/matcher/matcher.js";
import type { Context } from "../../src/shared/types.js";

const noop = (_ctx: Context) => {};

test("matches a registered route and method", () => {
  const router = createRouter();
  router.get("/health", noop);

  const result = router.match("GET", "/health");
  assert.ok(result);
  assert.deepEqual(result.params, {});
});

test("returns null when method does not match", () => {
  const router = createRouter();
  router.get("/health", noop);

  assert.equal(router.match("POST", "/health"), null);
});

test("returns null when no route matches", () => {
  const router = createRouter();
  router.get("/health", noop);

  assert.equal(router.match("GET", "/missing"), null);
});

test("extracts params from dynamic routes", () => {
  const router = createRouter();
  router.get("/users/:id", noop);

  const result = router.match("GET", "/users/42");
  assert.ok(result);
  assert.deepEqual(result.params, { id: "42" });
});

test("static route beats dynamic even when dynamic is registered first", () => {
  const router = createRouter();
  const dynamic = (_ctx: Context) => {};
  const staticRoute = (_ctx: Context) => {};

  router.get("/users/:id", dynamic);
  router.get("/users/me", staticRoute);

  const result = router.match("GET", "/users/me");
  assert.ok(result);
  assert.equal(result.handler, staticRoute);
});

test("allowedMethods returns verbs for an existing path", () => {
  const router = createRouter();
  router.get("/users/:id", noop);
  router.patch("/users/:id", noop);

  assert.deepEqual(router.allowedMethods("/users/42"), ["GET", "PATCH"]);
});

test("allowedMethods is empty when path does not exist", () => {
  const router = createRouter();
  router.get("/health", noop);

  assert.deepEqual(router.allowedMethods("/missing"), []);
});

test("matches catch-all routes and prefers more specific ones", () => {
  const router = createRouter();
  const catchAll = (_ctx: Context) => {};
  const guide = (_ctx: Context) => {};

  router.get("/docs/*path", catchAll);
  router.get("/docs/guide", guide);

  const specific = router.match("GET", "/docs/guide");
  assert.ok(specific);
  assert.equal(specific.handler, guide);

  const deep = router.match("GET", "/docs/a/b/c");
  assert.ok(deep);
  assert.equal(deep.handler, catchAll);
  assert.deepEqual(deep.params, { path: "a/b/c" });
});
