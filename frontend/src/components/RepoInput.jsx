export default function RepoInput({
  repoUrl,
  setRepoUrl,
  onAnalyze,
  isAnalyzing,
  analyzed,
  analyzeStatus,
  indexedRepo,
  analyzeFailed
}) {
  const showDefaultStatus = analyzed && !analyzeStatus;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="heading-font text-lg text-neon-cyan">Step 1</h2>
        <span className="text-xs text-slate-500">Repo input</span>
      </div>

      {indexedRepo && analyzed && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Indexed</span>
          <a
            href={repoUrl.trim()}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-neon-green/30 bg-neon-green/10 px-2.5 py-1 font-mono text-xs text-neon-green transition hover:bg-neon-green/20"
          >
            {indexedRepo}
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <label className="text-sm text-slate-400">
          GitHub repository URL
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={isAnalyzing}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-black/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-green focus:shadow-glow disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || !repoUrl.trim()}
          className="flex items-center justify-center gap-2 rounded-xl border border-neon-green/40 bg-neon-green/10 px-4 py-3 text-sm font-semibold text-neon-green transition hover:bg-neon-green/20 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neon-green/40 border-t-neon-green" />
          )}
          {isAnalyzing ? "ANALYZING..." : analyzed ? "RE-ANALYZE REPO" : "ANALYZE REPO"}
        </button>
        <p
          className={`text-sm ${
            analyzeFailed
              ? "text-red-400"
              : analyzed
                ? "text-neon-green"
                : "text-slate-500"
          }`}
          role="status"
        >
          {analyzeFailed
            ? analyzeStatus
            : showDefaultStatus
              ? "Repository indexed successfully"
              : analyzeStatus || "Paste a public GitHub URL and analyze."}
        </p>
      </div>
    </section>
  );
}
