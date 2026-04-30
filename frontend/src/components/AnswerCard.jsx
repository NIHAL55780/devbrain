export default function AnswerCard({ history, answer, isLoading }) {
  const hasHistory = Array.isArray(history) && history.length > 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex items-center justify-between">
        <h2 className="heading-font text-lg text-neon-green">Conversation</h2>
        <span className="text-xs text-slate-500">Q&A history</span>
      </div>

      <div className="mt-4 min-h-[220px] space-y-4 rounded-xl border border-slate-800 bg-black/70 p-4 text-sm leading-relaxed text-slate-200">
        {hasHistory ? (
          history.map((entry, index) => (
            <div key={`${entry.question}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Question</p>
              <p className="mt-1 text-sm text-neon-cyan">{entry.question}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Answer</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{entry.answer}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500">Ask a question to start the conversation.</p>
        )}
        {isLoading && (
          <p className="text-sm text-neon-green">Generating answer...</p>
        )}
        {!hasHistory && !isLoading && answer && (
          <p className="text-sm text-slate-400">{answer}</p>
        )}
      </div>
    </section>
  );
}
