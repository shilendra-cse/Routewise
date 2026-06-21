import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import {
  DocH2,
  DocP,
  DocPage,
  DocTable,
} from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Routing",
  description: "File-based routing conventions in Routewise.",
};

export default function RoutingPage() {
  return (
    <DocPage
      title="Routing"
      description="Method in the filename. Path in the folder tree."
    >
      <DocH2>Route files</DocH2>
      <DocTable>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>HTTP method</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>route.get.ts</code></td><td>GET</td></tr>
          <tr><td><code>route.post.ts</code></td><td>POST</td></tr>
          <tr><td><code>route.put.ts</code></td><td>PUT</td></tr>
          <tr><td><code>route.patch.ts</code></td><td>PATCH</td></tr>
          <tr><td><code>route.delete.ts</code></td><td>DELETE</td></tr>
        </tbody>
      </DocTable>

      <DocH2>Dynamic segments</DocH2>
      <DocP>
        Use a folder named <code>[param]</code> for dynamic URL segments.
        The value is available as <code>ctx.params.param</code>.
      </DocP>
      <CodeBlock
        title="resources/users/[id]/route.get.ts"
        code={`import type { Context } from "routewise";

export function handler(ctx: Context) {
  return ctx.json({ id: ctx.params.id });
}`}
      />

      <DocH2>Folder → URL mapping</DocH2>
      <DocTable>
        <thead>
          <tr>
            <th>Folder segments</th>
            <th>URL pattern</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>[]</code> (root)</td><td><code>/</code></td></tr>
          <tr><td><code>["health"]</code></td><td><code>/health</code></td></tr>
          <tr><td><code>["users", "[id]"]</code></td><td><code>/users/:id</code></td></tr>
          <tr><td><code>["users", "[id]", "posts", "[postId]"]</code></td><td><code>/users/:id/posts/:postId</code></td></tr>
        </tbody>
      </DocTable>

      <DocH2>Export contract</DocH2>
      <DocP>
        Every <code>route.*.ts</code> must export a function named{" "}
        <code>handler</code>. Missing exports fail at startup with the file
        path in the error message.
      </DocP>
    </DocPage>
  );
}
