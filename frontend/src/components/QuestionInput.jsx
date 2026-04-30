export default function QuestionInput({
  question,
  setQuestion,
  onAsk,
  isAsking,
  canAsk,
  analyzed
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex items-center justify-between">
        <h2 className="heading-font text-lg text-neon-cyan">Step 2</h2>
        <span className="text-xs text-slate-500">Ask a question</span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <label className="text-sm text-slate-400">
          Question
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="How does authentication work?"
            rows={6}
            className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-black/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-cyan focus:shadow-glow"
          />
        </label>
        <button
          onClick={onAsk}
          disabled={!canAsk}
          className="flex items-center justify-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-3 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/20 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAsking && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neon-cyan/40 border-t-neon-cyan" />
          )}
          {isAsking ? "THINKING..." : "ASK QUESTION"}
        </button>
        {!analyzed && (
          <p className="text-xs text-slate-500">
            Analyze a repo before asking a question.
          </p>
        )}
      </div>
    </section>
  );
}
