# Routewise

> Your folders are your API.

File-based HTTP framework for Node. Define endpoints in a `resources/` folder — each subfolder is an API resource; `route.get.ts`, `route.post.ts`, etc. map to HTTP methods.

---

## Developer documentation

This README is the **living developer reference**. Every feature we add gets documented here so behavior stays discoverable and we don't lose track of conventions. Deep rationale lives in [`design-decisions/`](./design-decisions/README.md); this file is the practical "how do I use it" guide.

> **Contributing rule:** when you add or change a user-facing feature, update the relevant section below in the same change. If there's a design trade-off worth recording, add or update a `design-decisions/` doc and link it.

### Contents

- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [Routing](#routing)
- [Handlers & the context object](#handlers--the-context-object)
- [Middleware](#middleware)
  - [The middleware primitive](#the-middleware-primitive)
  - [Where a file lives = where it runs](#where-a-file-lives--where-it-runs)
  - [Ordering & composers](#ordering--composers)
  - [Per-route controls: `use` and `skip`](#per-route-controls-use-and-skip)
  - [Method-specific middleware: `methods`](#method-specific-middleware-methods)
  - [Opt-in only middleware: `inherit`](#opt-in-only-middleware-inherit)
  - [Execution order summary](#execution-order-summary)
- [Feature reference table](#feature-reference-table)
- [Development](#development)

---

## Quick start

```ts
// main.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routewise } from "routewise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.join(__dirname, "resources");

const app = await routewise({ resourcesDir });
app.listen(3000);
```

`routewise()` scans `resourcesDir`, compiles every route + middleware once at startup, and returns an app with a `listen(port)` method. If a route file is broken or missing its `handler` export, the process fails at startup (not on first request).

---

## Project layout

```
resources/
├── logger.middleware.ts          → runs on ALL routes
├── health/
│   └── route.get.ts              → GET /health
└── users/
    ├── auth.middleware.ts        → runs on /users/*
    ├── route.get.ts              → GET /users
    ├── route.post.ts             → POST /users
    └── [id]/
        ├── specific.middleware.ts → runs on /users/:id (subject to its config)
        ├── route.get.ts          → GET /users/:id
        ├── route.post.ts         → POST /users/:id
        └── route.patch.ts        → PATCH /users/:id
```

Only `route.*.ts`, `*.middleware.ts`, and `middleware.ts` are special. **Any other file is ignored by the compiler** and can be imported as normal code (services, helpers, types).

---

## Routing

| Pattern | Meaning |
| --- | --- |
| `route.get.ts` | `GET` handler for this folder's path |
| `route.post.ts` | `POST` handler |
| `route.put.ts` | `PUT` handler |
| `route.patch.ts` | `PATCH` handler |
| `route.delete.ts` | `DELETE` handler |
| `[name]/` folder | Dynamic segment → `:name`, available as `ctx.params.name` |

Folder segments map to URL patterns:

| Folder segments | URL pattern |
| --- | --- |
| `[]` (root) | `/` |
| `["health"]` | `/health` |
| `["users", "[id]"]` | `/users/:id` |
| `["users", "[id]", "posts", "[postId]"]` | `/users/:id/posts/:postId` |

Every `route.*.ts` must export a `handler` function. See [002 — File-based routing](./design-decisions/002-file-based-routing.md).

---

## Handlers & the context object

```ts
import type { Context } from "routewise";

export function handler(ctx: Context) {
  return ctx.json({ id: ctx.params.id });
}
```

The `Context` (`ctx`) passed to every handler and middleware:

| Field / method | Description |
| --- | --- |
| `ctx.method` | HTTP method (`"GET"`, `"POST"`, …) |
| `ctx.path` | Request path |
| `ctx.params` | Dynamic route params, e.g. `{ id: "42" }` |
| `ctx.query` | Parsed query string params |
| `ctx.headers` | Request headers (string values) |
| `ctx.auth` | Free-form slot for auth middleware to stash a user |
| `ctx.status(code)` | Set response status; returns `ctx` for chaining |
| `ctx.json(data)` | Send a JSON response |
| `ctx.notFound(msg?)` | Send 404 |
| `ctx.unauthorized(msg?)` | Send 401 |

See [005 — Context object](./design-decisions/005-context-object.md).

---

## Middleware

Routewise uses **one middleware primitive** plus a small set of declarative knobs. See [001 — Middleware model](./design-decisions/001-middleware.md) for the full rationale.

### The middleware primitive

A middleware is an Express-style onion function. Code before `await next()` runs on the way in; code after runs on the way out; wrap `next()` in `try/catch` for error handling.

```ts
import type { Middleware } from "routewise";

export const middleware: Middleware = async (ctx, next) => {
  // before the handler
  await next();
  // after the handler
};
```

Returning **before** `await next()` short-circuits the chain (the handler never runs) — this is how auth/validation reject requests:

```ts
export const middleware: Middleware = async (ctx, next) => {
  if (!ctx.headers.authorization) return ctx.unauthorized();
  await next();
};
```

### Where a file lives = where it runs

A `*.middleware.ts` file applies to every route **at or below its folder**. Deeper folder → narrower scope.

```
resources/
├── logger.middleware.ts        ← all routes
└── users/
    ├── auth.middleware.ts      ← /users and everything under it
    └── [id]/
        └── specific.middleware.ts ← /users/:id only
```

The filename without the `.middleware.ts` suffix is the middleware's **name** (e.g. `auth.middleware.ts` → `"auth"`). Names are used by `use` and `skip`.

### Ordering & composers

Within a single folder, middleware runs in **alphabetical order** by filename. Across folders, **outer runs before inner**.

To control order explicitly inside a folder, add a `middleware.ts` **composer** that exports an array. It **replaces** the alphabetical chain for that folder:

```ts
// users/middleware.ts
import { middleware as auth } from "./auth.middleware.js";
import { middleware as rateLimit } from "./rate-limit.middleware.js";

export const middleware = [rateLimit, auth]; // rateLimit runs first
```

### Per-route controls: `use` and `skip`

Route files can opt in or out of middleware via two exports:

```ts
// users/[id]/route.get.ts
export const use = ["specific"];   // add middleware to THIS route
export const skip = ["auth"];      // remove an inherited middleware from THIS route

export function handler(ctx) {
  return ctx.json({ id: ctx.params.id });
}
```

| Export | Type | Meaning |
| --- | --- | --- |
| `skip` | `string[]` | Names of inherited middleware to remove |
| `use` | `(string \| Middleware)[]` | Middleware to add for this route only |

**`use` accepts both names and functions:**

- **String** → resolves to a `*.middleware.ts` file in the **same folder** as the route. Startup error if no match.
- **Function** → an inline or third-party middleware (e.g. `helmet()`).

```ts
import helmet from "helmet";
export const use = ["specific", helmet()];
```

**Deduplication:** if a middleware would run both via inheritance and via `use`, it runs **once** (deduped by file path). This prevents the classic double-execution bug.

### Method-specific middleware: `methods`

A middleware file can restrict itself to specific HTTP methods. This solves "apply to GET + POST but not PATCH" without touching every route file:

```ts
// users/[id]/specific.middleware.ts
export const methods = ["GET", "POST"];

export const middleware: Middleware = async (ctx, next) => {
  await next();
};
```

Now `specific` auto-applies to `GET /users/:id` and `POST /users/:id`, but **not** `PATCH /users/:id`. Method names are case-insensitive.

### Opt-in only middleware: `inherit`

By default a `*.middleware.ts` file auto-applies to all routes in scope. Set `inherit = false` to make it **opt-in only** — it won't run unless a route explicitly lists it in `use`:

```ts
// users/[id]/specific.middleware.ts
export const inherit = false;

export const middleware: Middleware = async (ctx, next) => {
  await next();
};
```

```ts
// only this route gets it
export const use = ["specific"];
```

### Execution order summary

For a request, the resolved chain is:

```
1. Outer-folder middleware  (root → route folder, alphabetical or composer order)
2. Inner-folder middleware
   — filtered by `methods` (if set)
   — dropped if `inherit = false` (unless named in `use`)
   — dropped if named in the route's `skip`
3. Route-level `use` (names resolved from the route's folder, then functions)
   — deduped against already-included middleware
4. Handler
5. Outbound: code after `await next()` unwinds in reverse order
```

---

## Feature reference table

| Feature | Where you declare it | Type | Notes |
| --- | --- | --- | --- |
| Route handler | `route.<method>.ts` | `handler` fn | Required export |
| Dynamic segment | `[name]/` folder | — | → `ctx.params.name` |
| Scoped middleware | `*.middleware.ts` file location | — | Applies at/below its folder |
| Explicit order | `middleware.ts` composer | `Middleware[]` | Replaces alphabetical order in that folder |
| Add per route | `use` in route file | `(string \| Middleware)[]` | Names (same folder) or functions |
| Remove per route | `skip` in route file | `string[]` | Inherited middleware names |
| Limit to methods | `methods` in middleware file | `string[]` | Case-insensitive; default = all methods |
| Opt-in only | `inherit` in middleware file | `boolean` | `false` = only runs via `use` |

---

## Development

```bash
npm run build          # compile src/ → dist/
npm run example:node   # run the example API (Node + tsx)
npm run example:bun    # run the example API (Bun)
npm run dev            # example in watch mode
npm run web:dev        # product site & docs (Next.js)
```

The example app under [`examples/basic-api`](./examples/basic-api) imports `routewise` exactly the way a published consumer would. Use it to verify behavior changes end-to-end.

Documentation is also published as a Next.js site under [`web/`](./web). When you add a feature, update both this README and the matching page in `web/app/docs/`.
