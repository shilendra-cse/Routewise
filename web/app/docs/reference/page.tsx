import type { Metadata } from "next";
import {
  DocH2,
  DocP,
  DocPage,
  DocTable,
} from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Feature reference",
  description: "Every Routewise knob in one table.",
};

export default function ReferencePage() {
  return (
    <DocPage
      title="Feature reference"
      description="Quick lookup for every declarative export and convention."
    >
      <DocTable>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Where</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Route handler</td>
            <td><code>route.&lt;method&gt;.ts</code></td>
            <td><code>handler</code> fn</td>
            <td>Required export</td>
          </tr>
          <tr>
            <td>Dynamic segment</td>
            <td><code>[name]/</code> folder</td>
            <td>—</td>
            <td>→ <code>ctx.params.name</code></td>
          </tr>
          <tr>
            <td>JSON request body</td>
            <td>automatic</td>
            <td>—</td>
            <td><code>ctx.body</code> when <code>Content-Type: application/json</code></td>
          </tr>
          <tr>
            <td>Raw request body</td>
            <td>automatic</td>
            <td>—</td>
            <td><code>ctx.rawBody</code> when body is read</td>
          </tr>
          <tr>
            <td>Body size limit</td>
            <td><code>routewise({`{ bodyLimit }`})</code></td>
            <td><code>number</code></td>
            <td>Default 1MB (bytes)</td>
          </tr>
          <tr>
            <td>Scoped middleware</td>
            <td><code>*.middleware.ts</code> location</td>
            <td>—</td>
            <td>Applies at/below its folder</td>
          </tr>
          <tr>
            <td>Explicit order</td>
            <td><code>middleware.ts</code> composer</td>
            <td><code>Middleware[]</code></td>
            <td>Replaces alphabetical order</td>
          </tr>
          <tr>
            <td>Add per route</td>
            <td><code>use</code> in route file</td>
            <td><code>(string | Middleware)[]</code></td>
            <td>Names or functions</td>
          </tr>
          <tr>
            <td>Remove per route</td>
            <td><code>skip</code> in route file</td>
            <td><code>string[]</code></td>
            <td>Inherited middleware names</td>
          </tr>
          <tr>
            <td>Limit to methods</td>
            <td><code>methods</code> in middleware file</td>
            <td><code>string[]</code></td>
            <td>Case-insensitive; default = all</td>
          </tr>
          <tr>
            <td>Opt-in only</td>
            <td><code>inherit</code> in middleware file</td>
            <td><code>boolean</code></td>
            <td><code>false</code> = only via <code>use</code></td>
          </tr>
        </tbody>
      </DocTable>

      <DocH2>Contributing rule</DocH2>
      <DocP>
        When you add or change a user-facing feature in Routewise, update the
        README and this docs site in the same change. Deep rationale goes in{" "}
        <code>design-decisions/</code>.
      </DocP>
    </DocPage>
  );
}
