import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-12 px-6 py-12">
      <DocsSidebar />
      {children}
    </div>
  );
}
