import assert from "node:assert/strict";
import { test } from "node:test";
import { routeSpecificity } from "../../src/matcher/utils/routeSpecificity.js";

test("static segments score higher than dynamic ones", () => {
  assert.ok(routeSpecificity(["users", "me"]) > routeSpecificity(["users", ":id"]));
});

test("dynamic segments score higher than catch-all", () => {
  assert.ok(
    routeSpecificity(["docs", ":id"]) > routeSpecificity(["docs", "*path"]),
  );
});

test("longer static paths score higher than shorter ones", () => {
  assert.ok(
    routeSpecificity(["users", "me", "profile"]) >
      routeSpecificity(["users", "me"]),
  );
});
