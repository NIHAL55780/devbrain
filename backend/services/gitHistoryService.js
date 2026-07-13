import axios from "axios";
import { githubHeaders } from "../utils/github.js";

const ALLOWED_EXTENSIONS = [".js", ".py", ".jsx", ".tsx", ".java", ".cpp", ".json", ".md"];
const MAX_COMMITS_TO_FETCH = 50;
const MAX_DETAIL_CONCURRENCY = 5;

const isRelevantFile = (filePath) =>
  ALLOWED_EXTENSIONS.some((ext) => filePath.toLowerCase().endsWith(ext));

const isMergeCommit = (message) => /^merge\b/i.test(message.trim());

const truncatePatch = (patch, maxLen = 1500) => {
  if (!patch || typeof patch !== "string") return "";
  if (patch.length <= maxLen) return patch;
  return `${patch.slice(0, maxLen)}\n... [truncated]`;
};

const fetchCommitDetail = async (owner, repo, sha) => {
  const { data } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    { headers: githubHeaders() }
  );

  const message = data.commit?.message || "";
  const date = data.commit?.author?.date || "";
  const author = data.commit?.author?.name || data.author?.login || "unknown";
  const files = (data.files || [])
    .filter((file) => isRelevantFile(file.filename))
    .map((file) => ({
      path: file.filename,
      status: file.status,
      patch: truncatePatch(file.patch),
    }));

  return {
    commitSha: sha,
    date,
    author,
    message: message.trim(),
    files,
  };
};

const runWithConcurrency = async (items, limit, worker) => {
  const results = [];
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
};

export const fetchRecentCommits = async (owner, repo, maxCommits = MAX_COMMITS_TO_FETCH) => {
  const { data } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/commits`,
    {
      headers: githubHeaders(),
      params: { per_page: Math.min(maxCommits, 100) },
    }
  );

  const shas = data
    .map((commit) => commit.sha)
    .filter(Boolean)
    .slice(0, maxCommits);

  const details = await runWithConcurrency(shas, MAX_DETAIL_CONCURRENCY, (sha) =>
    fetchCommitDetail(owner, repo, sha)
  );

  return details.filter(
    (commit) =>
      commit.files.length > 0 &&
      !isMergeCommit(commit.message) &&
      commit.message.length > 0
  );
};

export const buildDiffContext = (commit) => {
  const fileList = commit.files.map((file) => file.path).join(", ");
  const patches = commit.files
    .map((file) => `File: ${file.path} (${file.status})\n${file.patch}`)
    .join("\n\n");

  return {
    paths: fileList,
    diffSnippet: patches.slice(0, 3000),
  };
};
