export const parseRepoLabel = (repoUrl) => {
  if (!repoUrl?.trim()) return null;
  try {
    const url = new URL(repoUrl.trim());
    if (url.hostname !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    return { owner, repo, label: `${owner}/${repo}` };
  } catch {
    return null;
  }
};

export const githubFileUrl = (repoInfo, filePath) => {
  if (!repoInfo?.owner || !repoInfo?.repo || !filePath) return null;
  return `https://github.com/${repoInfo.owner}/${repoInfo.repo}/blob/main/${filePath}`;
};
