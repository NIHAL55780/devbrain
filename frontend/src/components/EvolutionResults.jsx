import MarkdownAnswer from "./MarkdownAnswer.jsx";
import CommitCard from "./CommitCard.jsx";

export default function EvolutionResults({
  history,
  commits,
  onClearChat,
}) {
  const items = Array.isArray(history) ? history : [];
  const commitItems = Array.isArray(commits) ? commits : [];
  const canClear = items.length > 0 && typeof onClearChat === "function";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
      <section className="panel flex min-h-[420px] flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">Evolution answers</h2>
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
            <p className="text-sm text-ink-faint">
              Ask how the codebase evolved — answers show a chronological story.
            </p>
          ) : (
            items.map((entry, index) => (
              <div key={entry.id ?? `evo-${index}`} className="space-y-3">
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
                      <span className="text-ink-muted">Tracing commit history…</span>
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

      <aside className="panel p-5">
        <h2 className="text-sm font-medium text-ink">Commit timeline</h2>
        <p className="mt-1 text-xs text-ink-faint">Commits retrieved for the last answer</p>
        <div className="mt-4 max-h-[min(480px,55vh)] space-y-2 overflow-y-auto">
          {commitItems.length === 0 ? (
            <p className="text-xs leading-relaxed text-ink-faint">
              Relevant commits appear here after you ask an evolution question.
            </p>
          ) : (
            commitItems.map((commit) => (
              <CommitCard key={commit.sha} commit={commit} />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
