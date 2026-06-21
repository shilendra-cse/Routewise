import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocH2, DocP, DocPage } from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Project layout",
  description: "How the resources/ folder is organized.",
};

export default function ProjectLayoutPage() {
  return (
    <DocPage
      title="Project layout"
      description="Only a few file types are special. Everything else is normal code."
    >
      <CodeBlock
        title="resources/"
        language="text"
        code={`resources/
├── logger.middleware.ts          → runs on ALL routes
├── health/
│   └── route.get.ts              → GET /health
└── users/
    ├── auth.middleware.ts        → runs on /users/*
    ├── route.get.ts              → GET /users
    ├── route.post.ts             → POST /users
    └── [id]/
        ├── specific.middleware.ts → runs on /users/:id
        ├── route.get.ts          → GET /users/:id
        ├── route.post.ts         → POST /users/:id
        └── route.patch.ts        → PATCH /users/:id`}
      />

      <DocH2>Special files</DocH2>
      <DocP>
        Only <code>route.*.ts</code>, <code>*.middleware.ts</code>, and{" "}
        <code>middleware.ts</code> (composer) are picked up by the compiler.
        Any other file — services, helpers, types — is ignored and can be
        imported normally.
      </DocP>

      <DocH2>Colocation</DocH2>
      <DocP>
        Keep domain logic next to the routes that use it. A{" "}
        <code>users/user.service.ts</code> file sits alongside{" "}
        <code>users/route.get.ts</code> without the compiler touching it.
      </DocP>
    </DocPage>
  );
}
