import { useState } from "react";

const clampScore = (score) => {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export default function SourceCard({ source }) {
  const [open, setOpen] = useState(false);
  const score = clampScore(source.score);
  const percent = Math.round(score * 100);

  return (
    <div className="rounded-xl border border-slate-800 bg-black/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-200">{source.file}</p>
          <p className="text-xs text-slate-500">Similarity score: {percent}%</p>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="text-xs text-neon-green transition hover:text-neon-cyan"
        >
          {open ? "HIDE CODE" : "VIEW CODE"}
        </button>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {open && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-200">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <span>Preview</span>
            <span>chunk</span>
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono">
            {source.preview || "No preview available"}
          </pre>
        </div>
      )}
    </div>
  );
}
