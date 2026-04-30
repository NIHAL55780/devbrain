let globalChunks = [];

export const setChunks = (chunks) => {
  globalChunks = chunks;
};

export const getChunks = () => {
  return globalChunks;
};