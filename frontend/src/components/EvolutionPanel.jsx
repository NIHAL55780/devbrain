import { SAMPLE_EVOLUTION_QUESTIONS } from "../constants/sampleEvolutionQuestions.js";

export default function EvolutionPanel({
  analyzed,
  indexedRepo,
  timelineBuilt,
  timelineStatusText,
  isBuildingTimeline,
  onBuildTimeline,
  evolutionQuestion,
  setEvolutionQuestion,
  onAskEvolution,
  isAskingEvolution,
  canAskEvolution,
}) {
  return (
    <section className="panel p-5">
      <h2 className="text-sm font-medium text-ink">Evolution</h2>
      <p className="mt-1 text-xs text-ink-faint">
        {indexedRepo
          ? `How ${indexedRepo} changed over time`
          : "Index a repo first, then build its commit timeline"}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onBuildTimeline}
          disabled={!analyzed || isBuildingTimeline || isAskingEvolution}
          className="btn-secondary w-full sm:w-auto"
        >
          {isBuildingTimeline && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-faint/30 border-t-ink" />
          )}
          {isBuildingTimeline
            ? "Building timeline…"
            : timelineBuilt
              ? "Rebuild timeline"
              : "Build timeline"}
        </button>

        {timelineStatusText && (
          <p
            className={`text-xs leading-relaxed ${
              timelineBuilt ? "text-ink-muted" : "text-amber-300/90"
            }`}
          >
            {timelineStatusText}
          </p>
        )}

        <form
          className="flex flex-col gap-3 border-t border-border-subtle pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            onAskEvolution();
          }}
        >
          <textarea
            value={evolutionQuestion}
            onChange={(event) => setEvolutionQuestion(event.target.value)}
            placeholder="e.g. Why is Redis used? How did auth change?"
            rows={4}
            disabled={!timelineBuilt || isAskingEvolution || isBuildingTimeline}
            className="field-input resize-none"
          />

          {timelineBuilt && (
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_EVOLUTION_QUESTIONS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  disabled={isAskingEvolution}
                  onClick={() => setEvolutionQuestion(sample)}
                  className="rounded-md border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs text-ink-muted transition hover:border-border hover:text-ink disabled:opacity-50"
                >
                  {sample}
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={!canAskEvolution}
            className="btn-primary w-full sm:w-auto"
          >
            {isAskingEvolution && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isAskingEvolution ? "Tracing history…" : "Ask about evolution"}
          </button>
        </form>
      </div>
    </section>
  );
}
