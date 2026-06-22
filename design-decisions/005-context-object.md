# 005 — Context Object (`ctx`)

**Status:** Implemented (partial)
**Last updated:** 2026-06-20

---

## Problem

Every handler and middleware needs uniform access to request data and response helpers. Two common shapes in the wild:

- Express: `req`, `res` — separate, low-level, mutable
- Koa / Hono / Fastify: single `ctx` — combines request and response

We pick the single-`ctx` model. One argument, everything on it, helpers for common responses. This avoids the "did I `res.send()`?" double-write footgun and keeps middleware signatures clean.

---

## Current shape (`src/shared/types.ts`)

```ts
interface Context {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: unknown;
  rawBody?: string;
  auth?: unknown;
  _req: IncomingMessage;   // advanced escape hatch
  _res: ServerResponse;    // advanced escape hatch

  status(code: number): Context;
  json(data: unknown): void;
  notFound(message?: string): void;
  unauthorized(message?: string): void;
  badRequest(message?: string): void;
}
```

### Implementation (`src/context/context.ts`)

```ts
export function createContext(req, res) {
  const { method, path, query, headers } = parseRequest(req);

  const ctx = {
    method, path, query, headers,
    params: {},          // filled in by the server after routing
    _status: 200,

    status(code)  { ctx._status = code; return ctx; },
    json(data)    { res.statusCode = ctx._status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(data)); },
    notFound()    { res.statusCode = 404; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ error: "Not Found" })); },
    unauthorized(msg = "unauthorized") { res.statusCode = 401; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ error: msg })); },
  };

  return ctx;
}
```

---

## Design choices

| Decision | Why |
| --- | --- |
| Single `ctx` argument | One thing to learn, one thing to type, chainable |
| `params` populated by server after routing | The matcher knows them; context creation runs before routing |
| `status()` returns `ctx` | Enables `ctx.status(201).json(data)` |
| Helpers terminate the response (`json`, `notFound`, `unauthorized`) | Common cases shouldn't require manual `res.end()` |
| Headers lowercased + flattened on the way in | Node hands them in mixed shapes (`string | string[] | undefined`); normalize once so middleware doesn't have to defensively check |
| `auth?: unknown` | Lets auth middleware stash a user object without us prescribing its shape |
| `_status` private-ish | Underscore signals "internal" — users go through `status()` |

---

## Headers normalization (`src/request/request.ts`)

```ts
function normalizeHeaders(headers) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    result[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return result;
}
```

- Keys are already lowercased by Node
- Arrays joined with `", "` so `ctx.headers.accept` is always a string
- `undefined` filtered out so consumers don't have to guard

---

## What's not on `ctx` yet (planned per `Framework.md`)

| Field / helper | Status |
| --- | --- |
| `ctx.body` | Implemented — JSON when `Content-Type: application/json` |
| `ctx.rawBody` | Implemented — raw string whenever body is read |
| `ctx.badRequest(msg)` | Implemented — 400 helper |
| `ctx._req` / `ctx._res` | Implemented — advanced escape hatches for streaming / low-level Node APIs |
| `ctx.send(body)` | Deferred — text/HTML helper |
| `ctx.setHeader(key, value)` | Deferred — direct header set on response |
| `ctx.forbidden(msg)` | Deferred |
| `ctx.redirect(url)` | Deferred |

The existing helpers cover the three most common error responses (404, 401) and the success path (`json` + `status`). Others can be added incrementally as the example app needs them.

---

## Subtle behaviours

- **`json` sets content-type every time.** Cheap, idempotent, removes a category of "forgot to set content-type" bugs.
- **`notFound` and `unauthorized` bypass `_status`.** They have fixed status codes. If the user wanted a custom code, they'd use `ctx.status(...).json(...)` directly.
- **`ctx` is created per request.** No object reuse. Garbage collection cost is acceptable for v1.
- **No response sent ⇒ undefined behaviour.** The server has a 404 fallback if the router doesn't match, but if a handler runs without calling any response helper, the connection hangs. v1 doesn't enforce a response — Phase 2 may.

---

## Trade-offs accepted

| Trade-off | Why |
| --- | --- |
| Helpers terminate immediately | Simpler API, but no way to "queue" a response. Streaming responses use `ctx._res`. |
| `params`/`auth` are mutable | Middleware *needs* to mutate them. Documented contract, not a hole. |
| No raw `req`/`res` on the main API | `ctx._req` / `ctx._res` exposed as documented advanced escape hatches |
| Headers always strings (lossy join) | Multi-value headers rarely matter; read raw headers via `ctx._req.headers` if needed. |

---

## Body parsing (server-level)

JSON body parsing is **not** middleware — the server reads the body after route matching and before the middleware chain:

- `ctx.body` — parsed JSON when `Content-Type: application/json`
- `ctx.rawBody` — raw string (webhooks, signature verification)
- Invalid JSON → 400; over limit → 413

Middleware and handlers both see the parsed body. See README "Request body" section.

---

## Deliberately deferred

- Multipart / form-urlencoded body parsing
- Streaming responses
- Cookie helpers
- Typed `ctx.params` and `ctx.query` (compile-time from route pattern)
- Per-route `Context` augmentation type (so `ctx.auth` can be typed by middleware)
