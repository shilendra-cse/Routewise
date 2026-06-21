import Link from "next/link";
import { CodeBlock } from "@/components/code-block";

const fileTree = `resources/
├── logger.middleware.ts     → all routes
├── health/
│   └── route.get.ts         → GET /health
└── users/
    ├── auth.middleware.ts   → /users/*
    ├── route.get.ts         → GET /users
    └── [id]/
        ├── route.get.ts     → GET /users/:id
        └── route.patch.ts   → PATCH /users/:id`;

const quickStart = `import path from "node:path";
import { fileURLToPath } from "node:url";
import { routewise } from "routewise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.join(__dirname, "resources");

const app = await routewise({ resourcesDir });
app.listen(3000);`;

const features = [
  {
    title: "Folder = route",
    description:
      "Drop a route.get.ts in a folder and you have an endpoint. Dynamic segments use [id]/ folders. No registration code.",
  },
  {
    title: "Colocated middleware",
    description:
      "One file type — *.middleware.ts. Where it lives is where it runs. use and skip give per-route control.",
  },
  {
    title: "Fail fast at startup",
    description:
      "The compiler scans your resources/ tree once. Broken handlers or missing exports throw before listen(), not on first request.",
  },
  {
    title: "Express-level control",
    description:
      "One middleware primitive with await next(). Before, after, and on-error in a single function. No guards, pipes, or decorators.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            File-based HTTP framework for Node
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Your folders are{" "}
            <span className="text-accent">your API</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted">
            Routewise turns a resources/ directory into a typed HTTP server.
            Routes, middleware, and scope — all visible in the file tree.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/docs/quick-start"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              The file tree is the API map
            </h2>
            <p className="mt-4 text-muted">
              Every subfolder is a resource path. route.get.ts, route.post.ts,
              and friends map to HTTP methods. Middleware files sit next to the
              routes they protect.
            </p>
          </div>
          <CodeBlock code={fileTree} language="text" title="resources/" />
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold tracking-tight">
            Built for clarity, not ceremony
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <h3 className="font-semibold text-accent">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start snippet */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold tracking-tight">Up and running</h2>
        <p className="mt-4 max-w-2xl text-muted">
          Point routewise at your resources folder. It compiles routes and
          middleware once at startup, then listens.
        </p>
        <CodeBlock code={quickStart} title="main.ts" />
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to explore?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Full documentation covers routing, the context object, middleware
            knobs, and the feature reference table.
          </p>
          <Link
            href="/docs/middleware"
            className="mt-8 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Middleware guide
          </Link>
        </div>
      </section>
    </main>
  );
}
