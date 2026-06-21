import type { Metadata } from "next";
import Link from "next/link";
import {
  DocH2,
  DocP,
  DocPage,
  DocUl,
} from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Introduction",
  description: "What Routewise is and how it works.",
};

export default function DocsIntroPage() {
  return (
    <DocPage
      title="Introduction"
      description="Routewise is a file-based HTTP framework for Node. Your folders are your API."
    >
      <DocP>
        Most frameworks ask you to register routes in code —{" "}
        <code>app.get(&quot;/users/:id&quot;, handler)</code>. Routewise flips
        that: you create files in a <code>resources/</code> folder and the
        compiler discovers routes and middleware at startup.
      </DocP>

      <DocH2>Core idea</DocH2>
      <DocUl>
        <li>
          <strong>Folder path</strong> → URL path (<code>users/[id]/</code> →{" "}
          <code>/users/:id</code>)
        </li>
        <li>
          <strong>route.get.ts</strong> → GET handler for that path
        </li>
        <li>
          <strong>*.middleware.ts</strong> → middleware scoped to that folder
          and everything below it
        </li>
      </DocUl>

      <DocH2>What you get</DocH2>
      <DocUl>
        <li>Colocated routes and middleware — scope is obvious from the tree</li>
        <li>One middleware primitive with Express-style <code>await next()</code></li>
        <li>Fail-fast compilation — broken files throw at startup, not on first request</li>
        <li>TypeScript-first with a typed <code>Context</code> object</li>
      </DocUl>

      <DocH2>Next steps</DocH2>
      <DocP>
        Head to the{" "}
        <Link href="/docs/quick-start" className="text-accent hover:underline">
          quick start
        </Link>{" "}
        to run your first app, or jump straight to{" "}
        <Link href="/docs/middleware" className="text-accent hover:underline">
          middleware
        </Link>{" "}
        to see the three-knob model.
      </DocP>
    </DocPage>
  );
}
