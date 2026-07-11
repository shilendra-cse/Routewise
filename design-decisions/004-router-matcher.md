# 004 — Router & Matcher

**Status:** Implemented
**Last updated:** 2026-06-19

---

## Problem

After the compiler binds routes, every incoming request needs an O(?) lookup that returns:

- the matched handler
- the params extracted from the URL

The matcher has to handle:

- exact segments (`/health`)
- dynamic segments (`/users/:id`)
- multiple dynamic segments (`/users/:id/posts/:postId`)
- HTTP method dispatch

For v1, raw speed matters less than **simplicity and correctness**. We can ship a linear matcher and swap it for a trie later without changing the public surface.

---

## Design

### Router shape (`src/matcher/type.ts`)

```ts
type Router = {
  get(pattern, handler): void;
  post(pattern, handler): void;
  put(pattern, handler): void;
  patch(pattern, handler): void;
  delete(pattern, handler): void;
  register(method, pattern, handler): void;
  match(method, path): MatchResult | null;
};

type MatchResult = {
  handler: Handler;
  params: Record<string, string>;
};
```

`register` is the lower-level API the compiler uses. The verb methods (`get`, `post`, …) exist for tests and the future programmatic path.

### Storage (`src/matcher/matcher.ts`)

```ts
const routes: Route[] = [];

function register(method, pattern, handler) {
  routes.push({
    method,
    pattern,
    segments: pattern.split("/").filter(Boolean),
    handler,
  });
}
```

Each `Route` is pre-split into segments at registration time so matching doesn't pay the split cost per request.

### Matching (`src/matcher/utils/matchSegments.ts`)

```ts
export function matchSegments(routeSegments, pathSegments) {
  if (routeSegments.length !== pathSegments.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < routeSegments.length; i++) {
    const routePart = routeSegments[i];
    const pathPart = pathSegments[i];

    if (routePart.startsWith(":")) {
      params[routePart.slice(1)] = pathPart;
    } else if (routePart !== pathPart) {
      return null;
    }
  }

  return params;
}
```

Segment count must match first (cheap reject). Then segment-by-segment compare, with `:name` placeholders capturing into `params`.

### Lookup loop

```ts
function match(method, path) {
  const pathSegments = path.split("/").filter(Boolean);
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchSegments(route.segments, pathSegments);
    if (params !== null) return { handler: route.handler, params };
  }
  return null;
}
```

Linear scan, first-match wins. Method filter first (skips ~80% in typical apps).

---

## Why linear, not trie

| Concern | Reality |
| --- | --- |
| Linear is O(n × k), where n = routes, k = avg segments | n is small for v1 apps (tens of routes). k is small (1–4). |
| Trie is faster but more code | Trie behaviour for params + future catch-alls is non-trivial. Defer until benchmarks demand it. |
| Behaviour easier to reason about | First-match-wins is predictable. Trie ordering requires more care. |

When we benchmark and the linear matcher costs more than ~5% of request time, swap the internals. The public API stays.

---

## First-match-wins semantics

Routes are tried in registration order. The compiler currently registers in `readdir` order. This is **stable enough for v1**, but two consequences:

- A literal segment and a dynamic one in the same slot at the same depth (`/users/me` vs `/users/:id`) — **static wins** via specificity scoring, independent of registration order.

---

## Method dispatch

Method is stored on each registered route. Lookup short-circuits if methods don't match. No separate per-method route table yet — the linear scan is cheap enough.

When the matcher becomes a trie, we'll likely move to one tree per method.

---

## Trade-offs accepted

| Trade-off | Why |
| --- | --- |
| Linear scan | Simple, easy to verify, fast enough for v1 |
| No conflict detection at register time | The compiler controls registration; users can't directly produce ambiguous routes |
| No 405 (Method Not Allowed) — returns 404 | **Superseded** — path exists under other methods → `405` + `Allow` |
| No HEAD/OPTIONS auto-handling | Out of scope for v1 |

---

## Matching refinements (2026-07-11)

| Behavior | Rule |
| --- | --- |
| Static vs dynamic vs catch-all | Specificity: static (10) > dynamic (1) > catch-all (0) |
| Wrong method | `router.allowedMethods(path)` → if non-empty and method miss → `405` |
| Catch-all | Pattern `*name`; must be last segment; params value is `/`-joined remainder |

---

## Deliberately deferred

- Trie / radix tree matcher
- Optional catch-all (`[[...name]]`)
- Optional segments
- Auto HEAD from GET, auto OPTIONS for CORS
- Route conflict detection at compile time
