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
    <section className="panel p-5">
      <h2 className="text-sm font-medium text-ink">Question</h2>
      <p className="mt-1 text-xs text-ink-faint">
        {indexedRepo ? `About ${indexedRepo}` : "Index a repo first"}
      </p>

      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onAsk();
        }}
      >
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. Where is the main API route defined?"
          rows={4}
          disabled={!analyzed || isAsking}
          className="field-input resize-none"
        />

        {analyzed && (
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((sample) => (
              <button
                key={sample}
                type="button"
                disabled={isAsking}
                onClick={() => setQuestion(sample)}
                className="rounded-md border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs text-ink-muted transition hover:border-border hover:text-ink disabled:opacity-50"
              >
                {sample}
              </button>
            ))}
          </div>
        )}

        <button type="submit" disabled={!canAsk} className="btn-primary w-full sm:w-auto">
          {isAsking && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isAsking ? "Working on it…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
