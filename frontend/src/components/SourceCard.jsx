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
  const fileName = source.file?.split("/").pop() || source.file;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-mono text-xs text-accent hover:underline"
              title={source.file}
            >
              {fileName}
            </a>
          ) : (
            <p className="truncate font-mono text-xs text-ink" title={source.file}>
              {fileName}
            </p>
          )}
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">{source.file}</p>
        </div>
        <span className="shrink-0 rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
          {percent}%
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 text-[11px] text-ink-faint transition hover:text-ink-muted"
      >
        {open ? "Hide snippet" : "Show snippet"}
      </button>

      {open && (
        <pre className="mt-2 max-h-36 overflow-auto rounded-md border border-border-subtle bg-surface p-2.5 font-mono text-[11px] leading-relaxed text-ink-muted whitespace-pre-wrap">
          {source.preview || "No preview"}
        </pre>
      )}
    </div>
  );
}
