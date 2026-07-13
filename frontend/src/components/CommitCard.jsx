export default function CommitCard({ commit }) {
  const paths = commit.paths
    ? commit.paths.split(",").map((path) => path.trim()).filter(Boolean)
    : [];

  return (
    <article className="rounded-lg border border-border-subtle bg-surface-raised p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {commit.url ? (
            <a
              href={commit.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-accent hover:underline"
            >
              {commit.shortSha || commit.sha?.slice(0, 7)}
            </a>
          ) : (
            <p className="font-mono text-xs text-ink">
              {commit.shortSha || commit.sha?.slice(0, 7)}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-ink-faint">
            {commit.date ? new Date(commit.date).toLocaleDateString() : "Unknown date"}
            {commit.author ? ` · ${commit.author}` : ""}
          </p>
        </div>
        {commit.score != null && (
          <span className="shrink-0 rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
            {typeof commit.score === "number" ? `${Math.round(commit.score * 100)}%` : commit.score}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink">{commit.summary || commit.message}</p>

      {paths.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {paths.slice(0, 4).map((path) => (
            <span
              key={path}
              className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
              title={path}
            >
              {path.split("/").pop()}
            </span>
          ))}
          {paths.length > 4 && (
            <span className="text-[10px] text-ink-faint">+{paths.length - 4} more</span>
          )}
        </div>
      )}
    </article>
  );
}
