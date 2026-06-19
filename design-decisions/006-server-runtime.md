# 006 — Server Runtime

**Status:** Implemented
**Last updated:** 2026-06-19

---

## Problem

After the compiler produces a fully-bound `Router`, we need an HTTP layer that:

- Accepts a Node `http.IncomingMessage` / `http.ServerResponse`
- Builds the per-request `ctx`
- Looks up the matching handler
- Catches async errors and returns a structured 500
- Returns a structured 404 if no route matches

The runtime should be **as dumb as possible** — all the intelligence lives in the compiler. This makes the hot path tight and the runtime easy to reason about.

---

## Implementation (`src/server/server.ts`)

```ts
export function createRoutewiseServer(router: Router) {
  const server = http.createServer(async (req, res) => {
    const ctx = createContext(req, res);
    const result = router.match(ctx.method, ctx.path);

    if (!result) return ctx.notFound();

    ctx.params = result.params;

    try {
      await result.handler(ctx);
    } catch {
      if (!res.headersSent)
        ctx.status(500).json({ error: "Internal Server Error" });
    }
  });

  return server;
}
```

That's the whole runtime.

---

## Design choices

### Native `node:http`, not a wrapper

- Zero runtime dependencies
- Node 18+ supports everything we need (`async` handlers, modern URL parsing)
- Easy to swap later (Bun's `Bun.serve`, undici, h3) without users seeing the change

### Single-pass per request

```
parse request → match route → 404 OR
                              attach params → call handler → catch → 500
```

No middleware logic at the server level. Middleware was already wrapped around the handler by the compiler. The server only invokes whatever function the router returns.

### 404 via `ctx.notFound()`

No raw `res.writeHead(404)`. The same helper handlers use is the same one the server uses for the "no route" case. Consistency is the point.

### 500 via try/catch around the handler

```ts
try {
  await result.handler(ctx);
} catch {
  if (!res.headersSent) ctx.status(500).json({ error: "Internal Server Error" });
}
```

- `await` catches both sync throws and rejected promises
- `headersSent` guard prevents double-write if the handler already started a response before throwing
- Error message is generic — no leaking stack traces to the client
- The thrown error is currently swallowed (no `console.error`); will revisit when logging is added

### Server is the boundary, not the kitchen

The server doesn't know about:

- Resource folders
- File scanning
- Middleware composition
- The route pattern format

That's all the compiler's job. The server just runs functions.

---

## Front door (`src/index.ts`)

```ts
export async function routewise(options?: { resourcesDir?: string }) {
  const router = await compile(options?.resourcesDir ?? "./resources");
  const server = createRoutewiseServer(router);

  return {
    listen(port: number) {
      server.listen(port, () => {
        console.log(`Routewise listening on port ${port}`);
      });
    },
  };
}
```

- Async because compile dynamically imports route files
- Options object pattern → easy to extend (`port`, `host`, `silent`, …) without breaking calls
- Returns a small interface (`listen`) — implementation detail of the underlying server stays hidden
- Default `resourcesDir = "./resources"` so the simplest usage is `await routewise()`

---

## Failure model

| Situation | Response |
| --- | --- |
| Route file missing or broken | Process throws at `compile()` time, before `listen` — user sees the error in their terminal |
| Request path doesn't match any route | `404 { "error": "Not Found" }` |
| Handler throws sync or async | `500 { "error": "Internal Server Error" }` |
| Handler already wrote some bytes then threw | We don't overwrite — `headersSent` guard prevents partial-response corruption |
| Malformed URL | Node's URL parser handles this; behaviour is whatever `new URL()` produces |

---

## What's intentionally missing

| Feature | Status | Reason |
| --- | --- | --- |
| `console.error(err)` on caught errors | Deferred | Bundle with proper logging story (Phase 2) |
| HTTPS / HTTP2 | Deferred | Most users front this with a reverse proxy; not v1 |
| Graceful shutdown | Deferred | Add when production deployment story lands |
| Keep-alive tuning | Default | Node's defaults are fine |
| Body size limits / timeouts | Deferred | Phase 2 with body parsing |
| 405 Method Not Allowed | Deferred | Matches matcher decision — see 004 |
| Trust proxy / `X-Forwarded-*` | Deferred | Specific to deployment, not a v1 default |

---

## Trade-offs accepted

| Trade-off | Why |
| --- | --- |
| One server function, one fn for everything | Smallest possible runtime surface |
| Errors are caught generically (no error type narrowing) | v1 — until we add `ctx.badRequest` etc., a generic 500 is fine |
| `console.log` on listen | Friendly default for `examples/basic-api`; users can replace `listen` later if they want silent mode |
| No middleware applied at the server level | All composition is compile-time; runtime stays predictable |

---

## Deliberately deferred

- Lifecycle hooks (`onListen`, `onShutdown`, `onError`)
- Custom server factory (`createRoutewiseServer({ httpServer })`)
- Multiple server instances per process
- HTTP/2, TLS
- Streaming response support (would change `ctx.json`/`ctx.send` contracts)
- Logger integration
