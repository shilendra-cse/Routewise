import assert from "node:assert/strict";
import { test } from "node:test";
import { pathToPattern } from "../../src/compiler/path-to-pattern.js";

test("root segments map to /", () => {
  assert.equal(pathToPattern([]), "/");
});

test("static segments join with slashes", () => {
  assert.equal(pathToPattern(["health"]), "/health");
  assert.equal(pathToPattern(["users", "posts"]), "/users/posts");
});

test("dynamic [param] segments become :param", () => {
  assert.equal(pathToPattern(["users", "[id]"]), "/users/:id");
});

test("multiple dynamic segments are converted", () => {
  assert.equal(
    pathToPattern(["users", "[id]", "posts", "[postId]"]),
    "/users/:id/posts/:postId",
  );
});

test("catch-all [...param] becomes *param", () => {
  assert.equal(pathToPattern(["docs", "[...path]"]), "/docs/*path");
});

test("root catch-all is supported", () => {
  assert.equal(pathToPattern(["[...slug]"]), "/*slug");
});

test("throws when catch-all is not the last segment", () => {
  assert.throws(
    () => pathToPattern(["docs", "[...path]", "extra"]),
    /must be the last folder/,
  );
});
