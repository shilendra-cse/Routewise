# 001 — Middleware Model

**Status:** Proposed
**Last updated:** 2026-06-19

---

## Problem

The first middleware pass used a single `middleware.ts` per folder. It works for one concern per scope, but breaks down as soon as a folder needs more than one cross-cutting behavior (auth + rate limit + logging).

We need a model that gives the user **full control** (like Express), keeps middleware **colocated with routes** (the Routewise pitch), and supports the full range of real-world scenarios.

---

## Scenarios we want to support

| # | Scenario | Scope | Short-circuit | Before / after handler |
| --- | --- | --- | --- | --- |
| 1 | Request logging / request ID | global | no | both |
| 2 | CORS / security headers | global or prefix | yes (OPTIONS) | before |
| 3 | Body parsing | global or prefix | yes (400) | before |
| 4 | Authentication | prefix or route | yes (401) | before |
| 5 | Authorization (roles, ownership) | prefix or route | yes (403) | before |
| 6 | Rate limiting | global / prefix / route | yes (429) | before |
| 7 | Input validation | route or prefix | yes (400) | before |
| 8 | Cache lookup | route | yes (304) | before |
| 9 | Cache store | route | no | after |
| 10 | Response transform / wrap | route or prefix | no | after |
| 11 | Metrics / tracing | global | no | both |
| 12 | DB transaction | route | no | both (commit / rollback) |
| 13 | Webhook signature verify | one route | yes (401) | before |
| 14 | Skip public routes (e.g. `/health`) | conditional | — | before |
| 15 | Error formatting | global | on throw | catch layer |
| 16 | Method-specific (POST only) | route or prefix | yes | before |

All of these have to be expressible without leaving the file-based mental model.

---

## Options considered

### Option A — Express-style (code owns order)

Routes stay in files. Middleware registered programmatically:

```ts
const app = await routewise({ resourcesDir });

app.use(logging);
app.use("/users", auth);
app.use("/users/:id", ownerGuard);

app.listen(3001);
```

| Pros | Cons |
| --- | --- |
| True Express control | Not colocated with routes |
| Order is obvious (top-to-bottom) | Breaks "your folders are your API" |
| No compiler magic | Discoverability is poor |

**Verdict:** rejected as the primary model. Kept as an **escape hatch** (`app.use` in `main.ts`) for third-party middleware and dynamic registration.

---

### Option B — NestJS-inspired layers in the file tree

Different file types for different jobs:

```
resources/
├── middleware.logging.ts
└── users/
    ├── guard.auth.ts
    ├── pipe.create-user.ts
    └── [id]/
        ├── guard.owner.ts
        └── route.get.ts
```

Fixed phase order at compile time: middleware → guards → pipes → handler → interceptors → filter.

| Pros | Cons |
| --- | --- |
| Phases are explicit | 4 file types is a lot to learn |
| Maps cleanly to known patterns (Nest) | Distinctions are conceptual overhead Routewise doesn't need |
| Each concern has a "shape" | Decorator-driven patterns don't fit a no-DI runtime |

**Verdict:** rejected. NestJS needs separate primitives because of decorators and DI. Routewise doesn't — the Express onion (`await next()` + try/catch) already gives us before / after / on-error in one function.

---

### Option B+ — One primitive, three knobs (chosen)

**One file type: `*.middleware.ts`**.
**Three knobs that control behavior:**

| Knob | Controls | Where you set it |
| --- | --- | --- |
| Folder location | scope (which routes it runs on) | file tree |
| Composer file | order within a scope | `middleware.ts` in folder |
| Route exports | opt-in / opt-out per route | inside `route.*.ts` |

That's the entire user surface.

---

## How it works

### Three rules

**Rule 1 — Where the file lives = where it runs**

```
resources/
├── logger.middleware.ts        ← runs on ALL routes
└── users/
    ├── auth.middleware.ts      ← runs on /users/*
    └── [id]/
        └── owner.middleware.ts ← runs only on /users/:id
```

Deeper folder → narrower scope. Mirrors how `route.*.ts` already works.

**Rule 2 — Default order is alphabetical. Composer file overrides it.**

By default, multiple middleware in a folder run in alphabetical order:

```
users/
├── auth.middleware.ts          ← runs first
└── rate-limit.middleware.ts    ← runs second
```

When that's wrong, drop a `middleware.ts` composer:

```ts
// users/middleware.ts
import { middleware as auth } from "./auth.middleware.js";
import { middleware as rateLimit } from "./rate-limit.middleware.js";

export const middleware = [rateLimit, auth];
```

If `middleware.ts` exists in a folder, it **replaces** the alphabetical chain at that level. The user writes the order in code, not metadata.

**Rule 3 — Routes opt in or out via small exports**

```ts
// users/[id]/route.get.ts
import { middleware as owner } from "./owner.middleware.js";

export const use = [owner];          // add for this route only
export const skip = ["rate-limit"];   // opt out of an inherited middleware

export function handler(ctx) {
  return ctx.json({ id: ctx.params.id });
}
```

`use` adds. `skip` removes. Both are plain arrays — no decorators.

### One primitive, three lifecycle phases

The Express onion already covers everything we need:

```ts
export const middleware = async (ctx, next) => {
  // BEFORE the handler
  try {
    await next();
    // AFTER the handler
  } catch (err) {
    // ON ERROR
    throw err;
  }
};
```

| You want to run code… | Put it… |
| --- | --- |
| Before everything | Before `await next()` |
| After the handler | After `await next()` |
| On errors | In a try/catch around `await next()` |

No separate guard / interceptor / filter file types. Position in the function = phase.

---

## Compile-time pipeline

For a request matching `GET /users/42`:

```
1. Root middleware       (resources/*.middleware.ts,  ordered by root middleware.ts if present)
2. Folder middleware     (users/*.middleware.ts,      ordered by users/middleware.ts if present)
3. Deeper folders        (users/[id]/*.middleware.ts)
4. Route-level `use`     (extra middleware on this route file)
5. Handler
6. Outbound (return path through each middleware, after their await next())
```

This is **fixed**. The user never configures phase ordering.

`skip: ["auth"]` removes by name from the resolved chain before binding.

---

## Worked examples

### Scenario coverage

| Scenario | Solution |
| --- | --- |
| Log every request | `resources/logger.middleware.ts` |
| CORS globally | `resources/cors.middleware.ts` |
| Auth on `/users/*` | `users/auth.middleware.ts` |
| Owner check on one route | `users/[id]/owner.middleware.ts` |
| Run rate-limit before auth | `users/middleware.ts` composer: `[rateLimit, auth]` |
| Skip auth on `/users/public` | `users/public/route.get.ts` → `export const skip = ["auth"]` |
| Time the request | logger uses `await next()` + diff |
| Format errors | global middleware wraps `await next()` in try/catch |
| Webhook signature | `webhooks/verify.middleware.ts` |
| Cache write after handler | `cache.middleware.ts` with code after `await next()` |
| Third-party (helmet, etc.) | `app.use(helmet())` in `main.ts` (escape hatch) |

### Beginning-only logger

```ts
// resources/logger.middleware.ts
export const middleware = async (ctx, next) => {
  console.log(ctx.method, ctx.path);
  await next();
};
```

No code after `await next()` ⇒ nothing runs on the way back out.

### Beginning + end (timing)

```ts
export const middleware = async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(ctx.method, ctx.path, Date.now() - start, "ms");
};
```

### Auth that short-circuits

```ts
export const middleware = async (ctx, next) => {
  if (!ctx.headers.authorization) return ctx.unauthorized();
  await next();
};
```

Returning before `await next()` stops the chain — the handler never runs.

---

## Why this fits Routewise

| Property | Option A (Express) | Option B (Nest layers) | Option B+ (chosen) |
| --- | --- | --- | --- |
| Full control | yes | yes | yes |
| Colocated with routes | no | yes | yes |
| Scope is obvious | first arg to `use()` | file type prefix | folder location |
| Order is explicit | top-to-bottom in `main.ts` | fixed phases | composer file |
| Concepts to learn | `app.use`, `next` | 4 file types | 1 file type + 2 knobs |
| Routewise vibe | weak | strong | strongest |

The pitch holds: **drop a `*.middleware.ts` in a folder, it runs. Want order, drop `middleware.ts`. Want per-route tweaks, use `use` / `skip`. Want third-party, `app.use()` in `main.ts`.**

Four sentences. Full Express control. Folder-first.

---

## Open questions to lock in before implementation

1. **`skip` identifier** — is it the filename without suffix (`"auth"`), the file path, or an explicit `export const name = "auth"`? Filename is simplest; scope makes collisions unlikely but possible.
2. **Composer semantics** — `users/middleware.ts` *replaces* the alphabetical chain at that level (chosen) vs *appends* to it. Replace is more predictable.
3. **Composer access to siblings** — composer files import siblings via `./auth.middleware.js`. Confirm this as the documented pattern.
4. **Composer + alphabetical fallback rule** — same rule applies at every depth: composer if present, alphabetical otherwise.
5. **Error middleware shape** — for v1, error handling is just try/catch around `await next()` in a regular middleware. A dedicated `error.middleware.ts` convention may come later.
6. **Method-specific middleware** — for v1, the middleware checks `ctx.method` itself. A first-class `methods: ["POST"]` declaration is deferred unless usage demands it.

---

## Deliberately deferred

- Per-middleware `methods: [...]` config
- Decorators / DI-style metadata
- Programmatic `app.use(path, mw)` beyond a simple `main.ts` escape hatch
- Schema-based validation as middleware (lives under the future `schema.ts` convention)
- Hot reload of middleware files during dev

---

## Implementation impact (not done yet)

When we implement this, expect changes in:

- `src/compiler/scan.ts` — match `*.middleware.ts`, detect optional `middleware.ts` composer per folder
- `src/compiler/type.ts` — extend `ScannedMiddleware` with name + composer info
- `src/middleware/resolve-middleware-chain.ts` — replace folder-prefix logic with: composer-if-present, alphabetical-otherwise, plus `skip` filtering
- `src/compiler/compile.ts` — honour route-level `use` / `skip` exports when wrapping handlers
- `src/shared/types.ts` — `Middleware` type already exists; no change expected
- `examples/basic-api/resources/` — rename to `logger.middleware.ts`, `auth.middleware.ts`, optionally add composer
