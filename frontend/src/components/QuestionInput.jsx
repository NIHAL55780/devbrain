import { SAMPLE_QUESTIONS } from "../constants/sampleQuestions.js";

export default function QuestionInput({
  question,
  setQuestion,
  onAsk,
  isAsking,
  canAsk,
  analyzed,
  indexedRepo
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="heading-font text-lg text-neon-cyan">Step 2</h2>
        <span className="text-xs text-slate-500">Ask a question</span>
      </div>

      {indexedRepo && (
        <p className="mt-3 text-xs text-slate-500">
          Asking about{" "}
          <span className="rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 font-mono text-neon-cyan">
            {indexedRepo}
          </span>
        </p>
      )}

      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAsk();
        }}
      >
        <label className="text-sm text-slate-400">
          Question
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="How does the app fetch weather data?"
            rows={5}
            disabled={!analyzed || isAsking}
            className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-black/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-cyan focus:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        {analyzed && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500">Try a sample question</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  disabled={isAsking}
                  onClick={() => setQuestion(sample)}
                  className="rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-left text-xs text-slate-300 transition hover:border-neon-cyan/40 hover:text-neon-cyan disabled:opacity-50"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!canAsk}
          className="flex items-center justify-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-3 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/20 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAsking && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neon-cyan/40 border-t-neon-cyan" />
          )}
          {isAsking ? "THINKING..." : "ASK QUESTION"}
        </button>
        {!analyzed && (
          <p className="text-xs text-slate-500">Analyze a repo before asking a question.</p>
        )}
      </form>
    </section>
  );
}
