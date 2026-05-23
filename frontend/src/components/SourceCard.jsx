import { useState } from "react";
import { githubFileUrl } from "../utils/parseRepo.js";

const clampScore = (score) => {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export default function SourceCard({ source, repoInfo }) {
  const [open, setOpen] = useState(false);
  const score = clampScore(source.score);
  const percent = Math.round(score * 100);
  const fileUrl = githubFileUrl(repoInfo, source.file);

  return (
    <div className="rounded-xl border border-slate-800 bg-black/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-neon-cyan hover:underline"
            >
              {source.file}
            </a>
          ) : (
            <p className="break-all text-sm text-slate-200">{source.file}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Similarity score: {percent}%</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 text-xs text-neon-green transition hover:text-neon-cyan"
        >
          {open ? "HIDE" : "PREVIEW"}
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
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono">
            {source.preview || "No preview available"}
          </pre>
        </div>
      )}
    </div>
  );
}
