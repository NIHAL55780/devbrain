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
    <section className="panel p-5">
      <h2 className="text-sm font-medium text-ink">Repository</h2>
      <p className="mt-1 text-xs text-ink-faint">Public GitHub URL</p>

      {indexedRepo && analyzed && (
        <a
          href={repoUrl.trim()}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block font-mono text-xs text-accent hover:underline"
        >
          {indexedRepo} ↗
        </a>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <input
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          placeholder="github.com/owner/repo"
          disabled={isAnalyzing}
          className="field-input font-mono"
        />
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || !repoUrl.trim()}
          className="btn-primary w-full sm:w-auto"
        >
          {isAnalyzing && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isAnalyzing ? "Indexing…" : analyzed ? "Re-index" : "Index repo"}
        </button>
        <p
          className={`text-xs leading-relaxed ${
            analyzeFailed ? "text-red-400" : analyzed ? "text-ink-muted" : "text-ink-faint"
          }`}
          role="status"
        >
          {analyzeFailed
            ? analyzeStatus
            : showDefaultStatus
              ? "Ready — ask a question below."
              : analyzeStatus || "We’ll fetch files, chunk them, and store embeddings in Chroma."}
        </p>
      </div>
    </section>
  );
}
