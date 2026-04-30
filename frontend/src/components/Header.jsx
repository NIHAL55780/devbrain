export default function Header() {
  return (
    <header className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          developer console
        </p>
        <h1 className="heading-font text-3xl text-neon-green">
          AI Codebase Analyzer
        </h1>
        <p className="text-lg text-slate-200">Understand any GitHub repo</p>
        <p className="text-sm text-slate-400">
          Index, search, and interrogate repositories with fast semantic search
          and code-aware answers.
        </p>
      </div>
    </header>
  );
}
