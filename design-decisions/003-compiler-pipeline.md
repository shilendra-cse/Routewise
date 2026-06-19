# 003 — Compiler Pipeline

**Status:** Implemented
**Last updated:** 2026-06-19

---

## Problem

File conventions are worthless without something that walks the tree, validates files, loads handlers, and binds them to a router. We need a startup pipeline that:

- Discovers routes and middleware in one filesystem walk
- Fails loudly at startup for malformed files (not at first request)
- Produces a fully-bound router that the HTTP layer can consume without further intelligence

The guiding principle: **compiler intelligence, dumb runtime.**

---

## The pipeline

```
routewise({ resourcesDir })
     │
     ▼
  compile(resourcesDir)
     │
     ├──► scan(resourcesDir)              one filesystem walk
     │       returns { routes, middlewares }
     │
     ├──► for each route:
     │       dynamic import(filePath)
     │       validate `handler` export
     │       resolve middleware chain
     │       wrap handler with chain
     │       router.register(method, pattern, wrapped)
     │
     ▼
  return Router
     │
     ▼
  createRoutewiseServer(router) → http.Server
```

After `compile()` returns, the router is **fully built**. No filesystem access or dynamic import happens per request.

---

## Stages

### 1. Scan (`src/compiler/scan.ts`)

Single recursive walk of `resourcesDir`. For each file, classify it:

| File name | Classification |
| --- | --- |
| `route.get.ts`, `route.post.ts`, … | route → `{ filePath, method, pattern, segments }` |
| `middleware.ts` | middleware → `{ filePath, segments }` |
| anything else | ignored |

`segments` is the folder path from the resources root (e.g. `["users", "[id]"]`). Routes also carry the URL pattern (`/users/:id`) produced by `pathToPattern`.

One walk produces **both** lists. Middleware and routes share the same traversal so we never re-read the disk.

### 2. Load + validate (`src/compiler/compile.ts`)

For each route:

```ts
const mod = await import(pathToFileURL(route.filePath).href);

if (typeof mod.handler !== "function") {
  throw new Error(`${route.filePath} must export handler`);
}
```

- `pathToFileURL` makes dynamic import work on both Windows and POSIX
- Missing or wrong-typed exports throw immediately
- Errors surface at startup with the file path — the user knows exactly which file is broken

Middleware files are loaded lazily through a cache (one import per file even if it's used on many routes):

```ts
async function loadMiddleware(filePath, cache) {
  const cached = cache.get(filePath);
  if (cached) return cached;
  const mod = await import(pathToFileURL(filePath).href);
  if (typeof mod.middleware !== "function") {
    throw new Error(`${filePath} must export middleware`);
  }
  cache.set(filePath, mod.middleware);
  return mod.middleware;
}
```

### 3. Resolve middleware chain

For each route, find which middleware applies (folder-prefix match), in order:

```ts
const chain = resolveMiddlewareChain(middlewares, route.segments);
```

Current logic: a middleware applies if its segments are a prefix of the route's segments. Sort by depth (shallowest first → global runs before folder middleware).

(The future Option B+ model — alphabetical default + composer override + route `use`/`skip` — replaces this resolver but leaves the rest of the pipeline intact.)

### 4. Wrap + register

```ts
const handler = withMiddleware(loadedMiddlewares, mod.handler);
router.register(route.method, route.pattern, handler);
```

After registration, the router holds a pre-wrapped function. The HTTP layer doesn't know middleware exists.

---

## Why startup-time compilation

| Design choice | Reason |
| --- | --- |
| Compile once, at boot | Avoids per-request overhead — no scanning, importing, or chain resolving in the hot path |
| Throw on bad file | Errors are caught before traffic arrives. No "first request triggers a 500." |
| Pre-bind middleware chains | Runtime only knows `handler(ctx)` — no middleware logic on every request |
| Dynamic `import()` (not `require`) | Native ESM, top-level `await`, future-proof |

---

## Failure modes

| What goes wrong | What happens |
| --- | --- |
| `route.get.ts` doesn't export `handler` | `Error: ${path} must export handler` — process exits |
| Empty `route.get.ts` | Same — missing export caught immediately |
| `middleware.ts` doesn't export `middleware` | Same shape of error |
| Syntax error in a route file | The dynamic import throws — caught by the user / shown in their terminal |
| `resourcesDir` doesn't exist | `readdir` throws ENOENT — surface as-is |

Fail-fast is intentional. A broken file should not run.

---

## Concurrency considerations

Routes are loaded **sequentially** today (`for...of`). For very large apps (hundreds of routes), this could become a startup bottleneck. We can switch to `Promise.all` later if it matters. Not premature.

Middleware loading already uses `Promise.all` per route because the cache makes it safe.

---

## Trade-offs accepted

| Trade-off | Why |
| --- | --- |
| Synchronous file discovery (single walk) | Simpler, fast enough for v1 sizes |
| No source-map manipulation | We rely on Node/tsx for sourcemaps; nothing custom |
| No watch mode in `compile()` | Watch will live in the dev runner, not the compiler |
| No bundling | Each file imported as a native ESM module. Bundling can come later if startup time becomes an issue |

---

## Deliberately deferred

- Parallel route loading (`Promise.all`)
- Persistent compile cache between restarts
- Source map enhancement for stack traces from anonymous handlers
- Plugin system (intercept the scan/compile pipeline)
