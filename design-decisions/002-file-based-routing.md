# 002 — File-Based Routing

**Status:** Implemented
**Last updated:** 2026-06-19

---

## Problem

Most frameworks require explicit registration: `app.get("/users/:id", handler)`. Routewise's pitch is "your folders are your API" — adding a new endpoint should mean creating a file, nothing else.

We need a folder convention that:

- Encodes HTTP method, URL path, and dynamic segments
- Allows colocating non-route code (helpers, types, services) inside the same resource folder
- Has one obvious answer for every common URL shape (root, nested, params)

---

## Conventions chosen

### Folder layout

The root of all API resources is `resources/`:

```
resources/
├── health/
│   └── route.get.ts            → GET /health
├── users/
│   ├── route.get.ts            → GET /users
│   ├── route.post.ts           → POST /users
│   └── [id]/
│       ├── route.get.ts        → GET /users/:id
│       ├── route.patch.ts      → PATCH /users/:id
│       └── route.delete.ts     → DELETE /users/:id
└── products/
    ├── route.get.ts            → GET /products
    └── services/
        └── pricing.ts          ← ignored by compiler, importable
```

### Naming rules

| Pattern | Meaning |
| --- | --- |
| `route.get.ts` | `GET` handler for this folder's path |
| `route.post.ts` | `POST` handler |
| `route.put.ts` | `PUT` handler |
| `route.patch.ts` | `PATCH` handler |
| `route.delete.ts` | `DELETE` handler |
| `[name]/` | Dynamic segment → `:name` in the matched pattern |
| `[...name]/` | Catch-all → `*name`; must be last; captures remaining path as `"a/b/c"` |
| Any other file | Ignored by the compiler; usable as a normal module |

### Export contract

Every `route.*.ts` file exports a function called `handler`:

```ts
// resources/users/[id]/route.get.ts
import type { Context } from "routewise";

export function handler(ctx: Context) {
  return ctx.json({ id: ctx.params.id });
}
```

The compiler refuses to start if the export is missing:

```
${filePath} must export handler
```

Fail-fast at startup, not at first request.

---

## Why this shape

| Decision | Rationale |
| --- | --- |
| Method in filename, not folder | One folder can serve many methods (`GET /users`, `POST /users`). Folder = path scope; filename = verb. |
| `[param]` folder, not `[param].ts` file | Dynamic segments can have nested children (`/users/[id]/posts/...`). Folders compose, files don't. |
| Only `route.*.ts` and `middleware.ts` are special | Any other file is normal code. Resource folders can hold services, types, helpers without compiler conflicts. |
| Top-level `resources/` is configurable | Single config (`resourcesDir`) keeps the convention but lets the user move it. |
| TypeScript-first (`.ts`) | v1 is TS-only. JS support deferred until publish. |

---

## Path translation

Folder segments map to URL pattern segments via `pathToPattern`:

```ts
// src/compiler/path-to-pattern.ts
export function pathToPattern(segments: string[]): string {
  if (segments.length === 0) return "/";
  const parts = segments.map((segment) =>
    segment.startsWith("[") && segment.endsWith("]")
      ? `:${segment.slice(1, -1)}`
      : segment,
  );
  return `/${parts.join("/")}`;
}
```

Examples:

| Folder segments | Pattern |
| --- | --- |
| `[]` | `/` |
| `["health"]` | `/health` |
| `["users", "[id]"]` | `/users/:id` |
| `["users", "[id]", "posts", "[postId]"]` | `/users/:id/posts/:postId` |
| `["docs", "[...path]"]` | `/docs/*path` |

---

## Matching behaviour

- **Static > dynamic > catch-all** — more specific routes always win, regardless of registration order.
- **405 vs 404** — path exists under other methods → `405` + `Allow`; unknown path → `404`.
- **Catch-all** — `[...name]/` must be last; matches one or more remaining segments into `ctx.params.name` as a `/`-joined string.

---

## Trade-offs accepted

| Trade-off | Why we accepted it |
| --- | --- |
| Catch-all value is a string, not an array | Keeps `ctx.params` as `Record<string, string>`; split on `/` if you need parts |
| Catch-all requires ≥1 segment | Optional catch-all (`[[...name]]`) deferred until needed |
| No optional params | Query params usually cover it |
| One folder = one path (can't split same path across folders) | Forces clear resource boundaries; matches the "folders are your API" pitch |
| No mixed-case method files (`route.GET.ts`) | Lowercase is the convention; saves users from inconsistent naming |

---

## Deliberately deferred

- Optional catch-all (`[[...name]]` — zero or more segments)
- Optional single segments
- Route groups (`(group)/` folder syntax)
- File-level method overrides (e.g. one file handling GET + POST)
- JS file support
