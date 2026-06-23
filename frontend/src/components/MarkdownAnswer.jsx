import ReactMarkdown from "react-markdown";

const mdComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>,
  li: ({ children }) => <li className="text-ink-muted">{children}</li>,
  strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-surface-overlay px-1 py-0.5 text-[0.8125rem] text-accent">
      {children}
    </code>
  ),
  h1: ({ children }) => <p className="mb-2 font-semibold text-ink">{children}</p>,
  h2: ({ children }) => <p className="mb-2 font-medium text-ink">{children}</p>,
  h3: ({ children }) => <p className="mb-1 font-medium text-ink-muted">{children}</p>
};

export default function MarkdownAnswer({ content, error = false }) {
  if (!content) {
    return <p className="text-ink-faint">No answer returned.</p>;
  }

  return (
    <div className={`markdown-answer text-sm ${error ? "text-red-300" : ""}`}>
      <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
    </div>
  );
}
