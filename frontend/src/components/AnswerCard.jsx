import MarkdownAnswer from "./MarkdownAnswer.jsx";

export default function AnswerCard({ history, onClearChat }) {
  const items = Array.isArray(history) ? history : [];
  const canClear = items.length > 0 && typeof onClearChat === "function";

  return (
    <section className="panel flex min-h-[420px] flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-ink">Chat</h2>
        {canClear && (
          <button
            type="button"
            onClick={onClearChat}
            className="text-xs text-ink-faint transition hover:text-ink-muted"
          >
            Clear
          </button>
        )}
      </div>

      <div className="chat-scroll mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain pr-1 max-h-[min(480px,55vh)]">
        {items.length === 0 ? (
          <p className="text-sm text-ink-faint">Your questions and answers show up here.</p>
        ) : (
          items.map((entry, index) => (
            <div key={entry.id ?? `turn-${index}`} className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2.5 text-sm text-ink">
                  {entry.question}
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className={`max-w-[95%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm ${
                    entry.isError
                      ? "border border-red-900/50 bg-red-950/30 text-red-300"
                      : "border border-border-subtle bg-surface-raised text-ink"
                  }`}
                >
                  {entry.pending ? (
                    <span className="text-ink-muted">Thinking…</span>
                  ) : (
                    <MarkdownAnswer content={entry.answer} error={entry.isError} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
