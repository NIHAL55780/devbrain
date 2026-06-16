let activeRepoId = null;

export const setActiveRepoId = (repoId) => {
  activeRepoId = repoId;
};

export const getActiveRepoId = () => activeRepoId;
