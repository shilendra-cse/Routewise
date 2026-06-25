import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveMiddlewareChain } from "../../src/middleware/resolve-middleware-chain.js";
import type { ScannedMiddleware } from "../../src/compiler/type.js";

function named(name: string, segments: string[]): ScannedMiddleware {
  return { filePath: `${segments.join("/")}/${name}`, segments, name, kind: "named" };
}

function composer(segments: string[]): ScannedMiddleware {
  return {
    filePath: `${segments.join("/")}/middleware.ts`,
    segments,
    name: "",
    kind: "composer",
  };
}

const names = (chain: ScannedMiddleware[]) =>
  chain.map((entry) => (entry.kind === "composer" ? "composer" : entry.name));

test("includes middleware from root down to the route folder", () => {
  const all = [
    named("logger", []),
    named("auth", ["users"]),
    named("owner", ["users", "[id]"]),
  ];

  const chain = resolveMiddlewareChain(all, ["users", "[id]"]);
  assert.deepEqual(names(chain), ["logger", "auth", "owner"]);
});

test("sorts middleware within a folder alphabetically", () => {
  const all = [named("rate-limit", ["users"]), named("auth", ["users"])];

  const chain = resolveMiddlewareChain(all, ["users"]);
  assert.deepEqual(names(chain), ["auth", "rate-limit"]);
});

test("composer replaces named middleware at its level", () => {
  const all = [
    named("auth", ["users"]),
    named("rate-limit", ["users"]),
    composer(["users"]),
  ];

  const chain = resolveMiddlewareChain(all, ["users"]);
  assert.deepEqual(names(chain), ["composer"]);
});

test("skip removes inherited middleware by name", () => {
  const all = [named("logger", []), named("auth", ["users"])];

  const chain = resolveMiddlewareChain(all, ["users"], ["auth"]);
  assert.deepEqual(names(chain), ["logger"]);
});

test("does not include middleware from sibling folders", () => {
  const all = [named("auth", ["users"]), named("billing", ["orders"])];

  const chain = resolveMiddlewareChain(all, ["users"]);
  assert.deepEqual(names(chain), ["auth"]);
});
