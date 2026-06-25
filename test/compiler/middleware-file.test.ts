import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isComposerFile,
  isNamedMiddlewareFile,
  middlewareNameFromFile,
} from "../../src/compiler/middleware-file.js";

test("isNamedMiddlewareFile detects *.middleware.ts", () => {
  assert.equal(isNamedMiddlewareFile("auth.middleware.ts"), true);
  assert.equal(isNamedMiddlewareFile("rate-limit.middleware.ts"), true);
  assert.equal(isNamedMiddlewareFile("route.get.ts"), false);
  assert.equal(isNamedMiddlewareFile("middleware.ts"), false);
});

test("isComposerFile only matches exactly middleware.ts", () => {
  assert.equal(isComposerFile("middleware.ts"), true);
  assert.equal(isComposerFile("auth.middleware.ts"), false);
});

test("middlewareNameFromFile strips the suffix", () => {
  assert.equal(middlewareNameFromFile("auth.middleware.ts"), "auth");
  assert.equal(middlewareNameFromFile("rate-limit.middleware.ts"), "rate-limit");
});
