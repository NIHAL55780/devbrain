export const githubCommitUrl = (repoInfo, sha) => {
  if (!repoInfo?.owner || !repoInfo?.repo || !sha) return null;
  return `https://github.com/${repoInfo.owner}/${repoInfo.repo}/commit/${sha}`;
};

export const formatCommitDate = (isoDate) => {
  if (!isoDate) return "Unknown date";
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate.slice(0, 10);
  }
};
