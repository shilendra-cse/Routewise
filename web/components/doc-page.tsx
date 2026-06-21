type DocPageProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function DocPage({ title, description, children }: DocPageProps) {
  return (
    <article className="min-w-0 flex-1 pb-16">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-3 text-lg text-muted">{description}</p>
        )}
      </header>
      <div className="doc-content space-y-6 text-[15px] leading-7 text-foreground/90">
        {children}
      </div>
    </article>
  );
}

export function DocH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-4 text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

export function DocH3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 text-base font-semibold text-foreground">
      {children}
    </h3>
  );
}

export function DocP({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}

export function DocTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function DocUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-4 list-disc space-y-2 pl-5 text-muted marker:text-accent">
      {children}
    </ul>
  );
}
