import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import {
  DocH2,
  DocH3,
  DocP,
  DocPage,
  DocTable,
  DocUl,
} from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Middleware",
  description: "One primitive, three knobs — scope, order, and per-route control.",
};

export default function MiddlewarePage() {
  return (
    <DocPage
      title="Middleware"
      description="One file type (*.middleware.ts) with folder scope, composers for order, and use/skip for per-route tweaks."
    >
      <DocP>
        Routewise rejected both Express-style registration and NestJS-style
        layer file types. Instead: one primitive, three knobs.
      </DocP>

      <DocTable>
        <thead>
          <tr>
            <th>Knob</th>
            <th>Controls</th>
            <th>Where</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Folder location</td><td>Scope (which routes)</td><td>File tree</td></tr>
          <tr><td>Composer file</td><td>Order within a folder</td><td><code>middleware.ts</code></td></tr>
          <tr><td><code>use</code> / <code>skip</code></td><td>Per-route opt-in / opt-out</td><td>Route file exports</td></tr>
        </tbody>
      </DocTable>

      <DocH2>The middleware primitive</DocH2>
      <DocP>
        Express-style onion. Code before <code>await next()</code> runs on the
        way in; code after runs on the way out.
      </DocP>
      <CodeBlock
        title="logger.middleware.ts"
        code={`import type { Middleware } from "routewise";

export const middleware: Middleware = async (ctx, next) => {
  console.log(\`\${ctx.method} \${ctx.path}\`);
  await next();
};`}
      />

      <DocH3>Short-circuit</DocH3>
      <DocP>
        Return before <code>await next()</code> to stop the chain. The handler
        never runs.
      </DocP>
      <CodeBlock
        title="auth.middleware.ts"
        code={`export const middleware: Middleware = async (ctx, next) => {
  if (!ctx.headers.authorization) return ctx.unauthorized();
  await next();
};`}
      />

      <DocH2>Where a file lives = where it runs</DocH2>
      <CodeBlock
        language="text"
        code={`resources/
├── logger.middleware.ts        ← all routes
└── users/
    ├── auth.middleware.ts      ← /users/*
    └── [id]/
        └── owner.middleware.ts ← /users/:id only`}
      />

      <DocP>
        The filename without <code>.middleware.ts</code> is the middleware{" "}
        <strong>name</strong> (e.g. <code>auth.middleware.ts</code> →{" "}
        <code>&quot;auth&quot;</code>). Names are used by <code>use</code> and{" "}
        <code>skip</code>.
      </DocP>

      <DocH2>Ordering & composers</DocH2>
      <DocP>
        Within a folder, middleware runs in alphabetical order. To override,
        add a <code>middleware.ts</code> composer that exports an array. It{" "}
        <strong>replaces</strong> the alphabetical chain at that level.
      </DocP>
      <CodeBlock
        title="users/middleware.ts"
        code={`import { middleware as auth } from "./auth.middleware.js";
import { middleware as rateLimit } from "./rate-limit.middleware.js";

export const middleware = [rateLimit, auth];`}
      />

      <DocH2>Per-route controls: use and skip</DocH2>
      <CodeBlock
        title="users/[id]/route.get.ts"
        code={`export const use = ["specific"];
export const skip = ["auth"];

export function handler(ctx) {
  return ctx.json({ id: ctx.params.id });
}`}
      />

      <DocTable>
        <thead>
          <tr>
            <th>Export</th>
            <th>Type</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>skip</code></td><td><code>string[]</code></td><td>Remove inherited middleware by name</td></tr>
          <tr><td><code>use</code></td><td><code>(string | Middleware)[]</code></td><td>Add middleware for this route only</td></tr>
        </tbody>
      </DocTable>

      <DocUl>
        <li><strong>String in use</strong> — resolves to a <code>*.middleware.ts</code> in the same folder</li>
        <li><strong>Function in use</strong> — inline or third-party middleware (e.g. helmet)</li>
        <li><strong>Deduplication</strong> — same middleware won&apos;t run twice if both inherited and in use</li>
      </DocUl>

      <DocH2>Method-specific: methods</DocH2>
      <DocP>
        Restrict middleware to specific HTTP methods — apply to GET + POST but
        not PATCH without touching every route file.
      </DocP>
      <CodeBlock
        title="specific.middleware.ts"
        code={`export const methods = ["GET", "POST"];

export const middleware: Middleware = async (ctx, next) => {
  await next();
};`}
      />

      <DocH2>Opt-in only: inherit</DocH2>
      <DocP>
        By default, middleware auto-applies to all routes in scope. Set{" "}
        <code>inherit = false</code> to require explicit <code>use</code>.
      </DocP>
      <CodeBlock
        code={`export const inherit = false;

export const middleware: Middleware = async (ctx, next) => {
  await next();
};

// In route.get.ts:
export const use = ["specific"];`}
      />

      <DocH2>Execution order</DocH2>
      <CodeBlock
        language="text"
        code={`1. Outer-folder middleware  (root → route folder)
2. Inner-folder middleware
   — filtered by methods (if set)
   — dropped if inherit = false (unless in use)
   — dropped if in route skip
3. Route-level use (names, then functions) — deduped
4. Handler
5. Outbound: code after await next() unwinds in reverse`}
      />
    </DocPage>
  );
}
