export default function Header({ indexedRepo }) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink-muted">DevBrain</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          Ask questions about a repo
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
          Paste a GitHub link, index the code, then chat with it. Answers cite the files they came
          from.
        </p>
      </div>
      {indexedRepo && (
        <div className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2">
          <p className="text-xs text-ink-faint">Indexed</p>
          <p className="mt-0.5 font-mono text-sm text-ink">{indexedRepo}</p>
        </div>
      )}
    </header>
  );
}
