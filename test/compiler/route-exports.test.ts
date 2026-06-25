import assert from "node:assert/strict";
import { test } from "node:test";
import { parseUse, readSkip } from "../../src/compiler/route-exports.js";

test("readSkip returns string names, ignoring non-strings", () => {
  assert.deepEqual(readSkip({ skip: ["auth", "rate-limit"] }), [
    "auth",
    "rate-limit",
  ]);
  assert.deepEqual(readSkip({ skip: ["auth", 42, null] }), ["auth"]);
});

test("readSkip defaults to empty array when absent or wrong type", () => {
  assert.deepEqual(readSkip({}), []);
  assert.deepEqual(readSkip({ skip: "auth" }), []);
});

test("parseUse splits string names and functions", () => {
  const fn = () => {};
  const result = parseUse({ use: ["specific", fn] }, "route.get.ts");

  assert.deepEqual(result.names, ["specific"]);
  assert.equal(result.functions.length, 1);
  assert.equal(result.functions[0], fn);
});

test("parseUse defaults to empty when use is absent", () => {
  const result = parseUse({}, "route.get.ts");
  assert.deepEqual(result.names, []);
  assert.deepEqual(result.functions, []);
});

test("parseUse throws on invalid entry types", () => {
  assert.throws(
    () => parseUse({ use: [123] }, "users/route.get.ts"),
    /use entries must be middleware names/,
  );
});
