import ReactMarkdown from "react-markdown";

const mdComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="text-slate-200">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-neon-cyan">{children}</code>
  ),
  h1: ({ children }) => <p className="mb-2 font-semibold text-neon-green">{children}</p>,
  h2: ({ children }) => <p className="mb-2 font-semibold text-neon-green">{children}</p>,
  h3: ({ children }) => <p className="mb-1 font-medium text-slate-100">{children}</p>
};

export default function MarkdownAnswer({ content, error = false }) {
  if (!content) {
    return <p className="text-sm text-slate-500">No answer returned</p>;
  }

  return (
    <div
      className={`markdown-answer text-sm leading-relaxed ${
        error ? "text-red-300" : "text-slate-200"
      }`}
    >
      <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
    </div>
  );
}
