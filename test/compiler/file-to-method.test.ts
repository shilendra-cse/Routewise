import assert from "node:assert/strict";
import { test } from "node:test";
import { fileToMethod } from "../../src/compiler/file-to-method.js";

test("maps known route files to HTTP methods", () => {
  assert.equal(fileToMethod("route.get.ts"), "GET");
  assert.equal(fileToMethod("route.post.ts"), "POST");
  assert.equal(fileToMethod("route.put.ts"), "PUT");
  assert.equal(fileToMethod("route.patch.ts"), "PATCH");
  assert.equal(fileToMethod("route.delete.ts"), "DELETE");
});

test("returns null for non-route files", () => {
  assert.equal(fileToMethod("auth.middleware.ts"), null);
  assert.equal(fileToMethod("route.get.js"), null);
  assert.equal(fileToMethod("helper.ts"), null);
  assert.equal(fileToMethod("route.GET.ts"), null);
});
