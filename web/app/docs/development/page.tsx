import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import {
  DocH2,
  DocP,
  DocPage,
} from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Development",
  description: "Build, run, and develop Routewise locally.",
};

export default function DevelopmentPage() {
  return (
    <DocPage
      title="Development"
      description="Commands for working on Routewise and the example app."
    >
      <DocH2>Framework</DocH2>
      <CodeBlock
        language="bash"
        code={`npm run build          # compile src/ → dist/
npm run example:node   # run the example API (Node + tsx)
npm run example:bun    # run the example API (Bun)
npm run dev            # example in watch mode`}
      />

      <DocH2>Docs site</DocH2>
      <CodeBlock
        language="bash"
        code={`npm run web:dev      # Next.js dev server
npm run web:build    # production build
npm run web:start    # serve production build`}
      />

      <DocH2>Example app</DocH2>
      <DocP>
        The example under <code>examples/basic-api</code> imports{" "}
        <code>routewise</code> the same way a published consumer would. Use it
        to verify behavior changes end-to-end.
      </DocP>

      <DocH2>Repository structure</DocH2>
      <CodeBlock
        language="text"
        code={`Routewise/
├── src/                 # framework source
├── dist/                # compiled output
├── examples/basic-api/  # runnable example
├── web/                 # product site & docs (this site)
└── design-decisions/    # architectural rationale`}
      />
    </DocPage>
  );
}
