import assert from "node:assert/strict";
import { test } from "node:test";
import { matchSegments } from "../../src/matcher/utils/matchSegments.js";

test("returns empty params for an exact static match", () => {
  assert.deepEqual(matchSegments(["users"], ["users"]), {});
});

test("captures dynamic params", () => {
  assert.deepEqual(matchSegments(["users", ":id"], ["users", "42"]), {
    id: "42",
  });
});

test("captures multiple params", () => {
  assert.deepEqual(
    matchSegments(["users", ":id", "posts", ":postId"], [
      "users",
      "42",
      "posts",
      "7",
    ]),
    { id: "42", postId: "7" },
  );
});

test("returns null when lengths differ", () => {
  assert.equal(matchSegments(["users", ":id"], ["users"]), null);
});

test("returns null when a static segment differs", () => {
  assert.equal(matchSegments(["users"], ["posts"]), null);
});
