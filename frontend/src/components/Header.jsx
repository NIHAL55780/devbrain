export default function Header({ indexedRepo }) {
  return (
    <header className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">developer console</p>
          <h1 className="heading-font text-2xl text-neon-green sm:text-3xl">DevBrain</h1>
          <p className="text-lg text-slate-200">Understand any GitHub repo</p>
          <p className="max-w-2xl text-sm text-slate-400">
            Index, search, and ask questions about a codebase with semantic retrieval and
            code-aware answers.
          </p>
        </div>
        {indexedRepo && (
          <div className="shrink-0 rounded-xl border border-neon-green/25 bg-neon-green/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Active repo</p>
            <p className="mt-1 font-mono text-sm text-neon-green">{indexedRepo}</p>
          </div>
        )}
      </div>
    </header>
  );
}
