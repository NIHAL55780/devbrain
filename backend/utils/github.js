export const parseGitHubRepoUrl = (repoUrl) => {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== "github.com") {
      return null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    if (!owner || !repo) {
      return null;
    }
    return { owner, repo };
  } catch {
    return null;
  }
};

export const makeRepoId = (owner, repo) => `${owner}_${repo}`;

export const githubHeaders = () => ({
  Authorization: `token ${process.env.GITHUB_TOKEN || ""}`,
  Accept: "application/vnd.github+json",
});

export const githubCommitUrl = (owner, repo, sha) =>
  `https://github.com/${owner}/${repo}/commit/${sha}`;
