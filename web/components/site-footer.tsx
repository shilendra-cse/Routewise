import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Routewise — your folders are your API.
        </p>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Documentation
          </Link>
          <a
            href="https://github.com/shilendra-cse/Routewise"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
