import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import {
  DocH2,
  DocH3,
  DocP,
  DocPage,
  DocTable,
} from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Context object",
  description: "The ctx object passed to every handler and middleware.",
};

export default function ContextPage() {
  return (
    <DocPage
      title="Context object"
      description="One typed object for request data and response helpers."
    >
      <CodeBlock
        title="resources/users/[id]/route.get.ts"
        code={`import type { Context } from "routewise";

export function handler(ctx: Context) {
  return ctx.json({ id: ctx.params.id });
}`}
      />

      <DocH2>Fields & methods</DocH2>
      <DocTable>
        <thead>
          <tr>
            <th>Member</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>ctx.method</code></td><td>HTTP method (<code>&quot;GET&quot;</code>, <code>&quot;POST&quot;</code>, …)</td></tr>
          <tr><td><code>ctx.path</code></td><td>Request path</td></tr>
          <tr><td><code>ctx.params</code></td><td>Dynamic route params, e.g. <code>{`{ id: "42" }`}</code></td></tr>
          <tr><td><code>ctx.query</code></td><td>Parsed query string params</td></tr>
          <tr><td><code>ctx.headers</code></td><td>Request headers (string values)</td></tr>
          <tr><td><code>ctx.body</code></td><td>Parsed JSON when <code>Content-Type: application/json</code></td></tr>
          <tr><td><code>ctx.rawBody</code></td><td>Raw body string whenever a body is read</td></tr>
          <tr><td><code>ctx.auth</code></td><td>Free-form slot for auth middleware to stash a user</td></tr>
          <tr><td><code>ctx.status(code)</code></td><td>Set response status; returns <code>ctx</code> for chaining</td></tr>
          <tr><td><code>ctx.json(data)</code></td><td>Send a JSON response</td></tr>
          <tr><td><code>ctx.notFound(msg?)</code></td><td>Send 404</td></tr>
          <tr><td><code>ctx.unauthorized(msg?)</code></td><td>Send 401</td></tr>
          <tr><td><code>ctx.badRequest(msg?)</code></td><td>Send 400</td></tr>
          <tr><td><code>ctx._req</code></td><td>Node <code>IncomingMessage</code> — advanced escape hatch</td></tr>
          <tr><td><code>ctx._res</code></td><td>Node <code>ServerResponse</code> — streaming, custom headers</td></tr>
        </tbody>
      </DocTable>

      <DocH2>Advanced: <code>ctx._req</code> and <code>ctx._res</code></DocH2>
      <DocP>
        Underscore prefix signals advanced use. Prefer <code>ctx.json()</code> and
        other helpers for typical APIs. Use the escape hatches for streaming,
        custom headers, third-party Express middleware, or low-level Node APIs.
      </DocP>
      <DocP>
        Routewise reads the body before middleware and handlers run. The request
        stream on <code>ctx._req</code> may already be consumed — use{" "}
        <code>ctx.rawBody</code> for the raw payload.
      </DocP>
      <CodeBlock
        code={`// Wrap Express-style middleware
import type { Middleware } from "routewise";

export function fromExpress(expressMw: Function): Middleware {
  return (ctx, next) =>
    new Promise<void>((resolve, reject) => {
      expressMw(ctx._req, ctx._res, (err?: unknown) => {
        if (err) reject(err);
        else resolve(next());
      });
    });
}`}
      />

      <DocH2>Request body</DocH2>
      <DocP>
        The body is parsed after route matching and before middleware runs.
        Both middleware and handlers can read <code>ctx.body</code> and{" "}
        <code>ctx.rawBody</code>.
      </DocP>

      <DocTable>
        <thead>
          <tr>
            <th>Field</th>
            <th>When set</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ctx.rawBody</code></td>
            <td>Whenever the request has a body — use for webhook signatures</td>
          </tr>
          <tr>
            <td><code>ctx.body</code></td>
            <td>When <code>Content-Type</code> is <code>application/json</code> and parsing succeeds</td>
          </tr>
        </tbody>
      </DocTable>

      <CodeBlock
        title="resources/users/[id]/route.post.ts"
        code={`import type { Context } from "routewise";

export function handler(ctx: Context) {
  const body = ctx.body as { name?: string };
  return ctx.status(201).json({
    id: ctx.params.id,
    name: body?.name ?? null,
  });
}`}
      />

      <DocH3>Body errors</DocH3>
      <DocTable>
        <thead>
          <tr>
            <th>Condition</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Invalid JSON</td>
            <td><code>400</code> — <code>Invalid JSON</code></td>
          </tr>
          <tr>
            <td>Body over limit</td>
            <td><code>413</code> — <code>Payload too large</code></td>
          </tr>
        </tbody>
      </DocTable>

      <DocP>
        Default limit is 1MB. Override with{" "}
        <code>routewise({`{ bodyLimit: 5_242_880 }`})</code>.
      </DocP>

      <DocH2>Chaining status</DocH2>
      <CodeBlock
        code={`export function handler(ctx: Context) {
  return ctx.status(201).json({ created: true });
}`}
      />

      <DocH2>Auth slot</DocH2>
      <DocP>
        Middleware can write to <code>ctx.auth</code> and handlers read it.
        Routewise does not prescribe the shape — use whatever fits your app.
      </DocP>
    </DocPage>
  );
}
