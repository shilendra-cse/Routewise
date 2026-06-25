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

test("first registered match wins", () => {
  const router = createRouter();
  const first = (_ctx: Context) => {};
  const second = (_ctx: Context) => {};
  router.get("/users/me", first);
  router.get("/users/:id", second);

  const result = router.match("GET", "/users/me");
  assert.ok(result);
  assert.equal(result.handler, first);
});
