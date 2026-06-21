import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocH2, DocP, DocPage } from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Quick start",
  description: "Get Routewise running in minutes.",
};

export default function QuickStartPage() {
  return (
    <DocPage
      title="Quick start"
      description="Install Routewise, create a resources folder, and listen."
    >
      <DocH2>Install</DocH2>
      <CodeBlock
        code={`npm install routewise`}
        language="bash"
      />

      <DocH2>main.ts</DocH2>
      <CodeBlock
        title="main.ts"
        code={`import path from "node:path";
import { fileURLToPath } from "node:url";
import { routewise } from "routewise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.join(__dirname, "resources");

const app = await routewise({ resourcesDir });
app.listen(3000);`}
      />

      <DocP>
        Optional: set a custom body size limit (default 1MB) with{" "}
        <code>routewise({`{ resourcesDir, bodyLimit: 5_242_880 }`})</code>.
      </DocP>

      <DocH2>Your first route</DocH2>
      <CodeBlock
        title="resources/health/route.get.ts"
        code={`import type { Context } from "routewise";

export function handler(ctx: Context) {
  return ctx.json({ status: "ok" });
}`}
      />

      <DocP>
        Start the server and hit <code>GET /health</code>. Routewise scans{" "}
        <code>resources/</code>, compiles every route and middleware, and
        registers handlers before <code>listen()</code> is called.
      </DocP>

      <DocH2>Run with tsx</DocH2>
      <CodeBlock
        code={`npx tsx main.ts`}
        language="bash"
      />
    </DocPage>
  );
}
