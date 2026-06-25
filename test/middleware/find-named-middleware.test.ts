import assert from "node:assert/strict";
import { test } from "node:test";
import { findNamedMiddleware } from "../../src/middleware/find-named-middleware.js";
import type { ScannedMiddleware } from "../../src/compiler/type.js";

const all: ScannedMiddleware[] = [
  { filePath: "a", segments: ["users"], name: "auth", kind: "named" },
  { filePath: "b", segments: ["users", "[id]"], name: "owner", kind: "named" },
  { filePath: "c", segments: ["users"], name: "", kind: "composer" },
];

test("finds a named middleware in the same folder", () => {
  const found = findNamedMiddleware(all, ["users"], "auth");
  assert.equal(found?.filePath, "a");
});

test("does not match across folders", () => {
  assert.equal(findNamedMiddleware(all, ["users", "[id]"], "auth"), undefined);
});

test("does not match composer entries", () => {
  assert.equal(findNamedMiddleware(all, ["users"], ""), undefined);
});

test("returns undefined for unknown names", () => {
  assert.equal(findNamedMiddleware(all, ["users"], "missing"), undefined);
});
