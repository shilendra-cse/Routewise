# 007 — Package Structure & Example App

**Status:** Implemented
**Last updated:** 2026-06-19

---

## Problem

The framework is published as one npm package (`routewise`). We also need a way to:

- Develop the framework and an example app side-by-side in one repo
- Have the example app import `routewise` the same way an end user would
- Build cleanly for publishing (no example source in the npm tarball)

We deliberately avoid a monorepo / workspace setup for v1 — the framework is small enough that a single-package layout with one nested example is the simplest thing that works.

---

## Layout

```
Routewise/
├── package.json              ← the published package (name: "routewise")
├── tsconfig.json             ← builds src/ → dist/
├── src/                      ← framework source (TypeScript)
│   ├── index.ts              ← public entry point
│   ├── compiler/
│   ├── matcher/
│   ├── middleware/
│   ├── server/
│   ├── context/
│   ├── request/
│   └── shared/
├── dist/                     ← compiled JS + .d.ts (committed only via "files" → npm)
├── examples/
│   └── basic-api/
│       ├── package.json      ← depends on "routewise": "file:../.."
│       ├── tsconfig.json
│       ├── main.ts
│       └── resources/
│           ├── health/route.get.ts
│           └── users/[id]/route.get.ts
├── design-decisions/         ← this folder
├── Framework.md              ← vision doc (gitignored locally)
└── README.md
```

---

## Root `package.json` decisions

```json
{
  "name": "routewise",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "npm run dev --prefix examples/basic-api",
    "example:node": "npm run start --prefix examples/basic-api",
    "example:bun": "bun examples/basic-api/main.ts"
  }
}
```

| Decision | Why |
| --- | --- |
| `"type": "module"` | Native ESM. Dynamic `import()` in the compiler depends on it. |
| `exports` field | Modern Node + bundlers respect this. We expose a single entry. |
| `"files": ["dist"]` | Only the built JS + types ship to npm. `src/`, `examples/`, `design-decisions/` stay out of the tarball. |
| `"main"` + `"types"` for compat | Tools that don't read `exports` still find the entry. |
| `"engines": { "node": ">=18" }` | Top-level await, native fetch, modern URL parsing all assumed. |
| Root `dev` script delegates to example | One command from root spins up the example without users needing to `cd`. |

---

## Example app linkage (`examples/basic-api/package.json`)

```json
{
  "dependencies": {
    "routewise": "file:../.."
  }
}
```

| Decision | Why |
| --- | --- |
| `file:../..` instead of relative imports (`../../src/...`) | The example consumes `routewise` exactly the way a downstream user will — via `import { routewise } from "routewise"`. Catches packaging bugs early. |
| Example has its own `package.json` | Lets it have its own deps (`tsx`, `typescript`) without polluting the framework's tarball. |
| Example uses `tsx` for dev | Native TS execution, watch mode, zero-config. |
| Example `main.ts` uses `import.meta.url` | So `resourcesDir` resolves correctly no matter where you run it from. |

```ts
// examples/basic-api/main.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routewise } from "routewise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.join(__dirname, "resources");

const app = await routewise({ resourcesDir });
app.listen(3001);
```

---

## Why not a monorepo

| Argument for monorepo | Why we said no for v1 |
| --- | --- |
| Better isolation between framework and example | One package is fine for the size we're at |
| Multi-package publishing | We only publish one package today |
| pnpm/Yarn workspaces give nicer linking | `file:../..` is simpler and works with vanilla npm |
| Easier to add tooling packages (`@routewise/cli`, etc.) | If/when we add a CLI, we can introduce workspaces then |

The mental cost of workspaces (lockfile semantics, hoisting, install order) isn't worth it for a single shipped package + one example.

---

## Port choice

The example listens on **3001**, not 3000.

| Reason | Detail |
| --- | --- |
| Avoid local conflicts | 3000 is the default for too many other dev servers (Next.js, CRA, NestJS). Hitting `EADDRINUSE` once during demo was enough to move. |
| Distinct from "the obvious choice" | Makes the example's curl commands unambiguous in docs. |

Configurable per call (`app.listen(port)`), so this is just the example's default.

---

## Trade-offs accepted

| Trade-off | Why |
| --- | --- |
| `dist/` committed for local testing simplicity | We can move to `prepublishOnly` later; today the cost is tiny and avoids "build before example" friction |
| Single-package layout limits future split | We accept this. Re-layout when there's a real second package to ship. |
| `file:../..` requires `npm install` after framework changes (if not relinked) | tsx + sourcemaps make the dev loop fast enough; revisit if it becomes painful. |
| No automated check that `examples/basic-api` still builds in CI | Will add once CI exists. For now, manual verification. |

---

## Deliberately deferred

- Workspaces (pnpm / npm / yarn)
- `@routewise/*` sub-packages
- `create-routewise` CLI scaffolder (Phase 4 per `Framework.md`)
- Automated publish pipeline
- `dist/` build via `prepublishOnly` instead of being committed
- ESM + CJS dual build (ESM-only is fine for v1)
- Bun-specific build target (currently runs via `bun examples/basic-api/main.ts` but no special build)
