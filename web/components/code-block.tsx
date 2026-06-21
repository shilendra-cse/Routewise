type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
};

export function CodeBlock({ code, language = "typescript", title }: CodeBlockProps) {
  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-border bg-surface">
      {title && (
        <figcaption className="border-b border-border px-4 py-2 text-xs text-muted">
          {title}
        </figcaption>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={`language-${language} font-mono text-foreground/90`}>
          {code}
        </code>
      </pre>
    </figure>
  );
}
