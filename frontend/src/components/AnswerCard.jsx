import MarkdownAnswer from "./MarkdownAnswer.jsx";

export default function AnswerCard({ history, onClearChat }) {
  const items = Array.isArray(history) ? history : [];
  const canClear = items.length > 0 && typeof onClearChat === "function";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="heading-font text-lg text-neon-green">Conversation</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {items.length === 0 ? "No messages" : `${items.length} turn${items.length === 1 ? "" : "s"}`}
          </span>
          {canClear && (
            <button
              type="button"
              onClick={onClearChat}
              className="text-xs text-slate-400 transition hover:text-neon-cyan"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 max-h-[min(520px,60vh)] min-h-[220px] space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-black/70 p-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Ask a question to start the conversation.</p>
        ) : (
          items.map((entry, index) => (
            <div
              key={entry.id ?? `turn-${index}`}
              className={`rounded-lg border p-3 ${
                entry.isError
                  ? "border-red-900/60 bg-red-950/20"
                  : "border-slate-800 bg-slate-950/70"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Question</p>
              <p className="mt-1 text-sm text-neon-cyan">{entry.question}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Answer</p>
              {entry.pending ? (
                <p className="mt-1 text-sm text-neon-green">Generating answer...</p>
              ) : (
                <div className="mt-1">
                  <MarkdownAnswer content={entry.answer} error={entry.isError} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
