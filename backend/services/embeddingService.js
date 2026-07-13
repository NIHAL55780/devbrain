import axios from "axios";

const BASE = process.env.EMBED_SERVICE_URL || "http://localhost:8000";

export const indexRepo = async (repoId, repoUrl, chunks) => {
  try {
    const response = await axios.post(`${BASE}/index`, {
      repoId,
      repoUrl,
      chunks,
    });
    return response.data;
  } catch (error) {
    console.error("Error indexing repo:", error.message);
    throw error;
  }
};

export const searchChunks = async (repoId, question, topK = 8) => {
  try {
    const response = await axios.post(`${BASE}/search`, {
      repoId,
      question,
      topK,
    });
    return response.data.chunks;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error searching chunks:", error.message);
    throw error;
  }
};

export const indexTimeline = async (repoId, repoUrl, commits) => {
  try {
    const response = await axios.post(`${BASE}/index/timeline`, {
      repoId,
      repoUrl,
      commits,
    });
    return response.data;
  } catch (error) {
    console.error("Error indexing timeline:", error.message);
    throw error;
  }
};

export const searchTimeline = async (repoId, question, topK = 12) => {
  try {
    const response = await axios.post(`${BASE}/search/timeline`, {
      repoId,
      question,
      topK,
    });
    return response.data.commits;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error searching timeline:", error.message);
    throw error;
  }
};

export const getTimelineStats = async (repoId) => {
  try {
    const response = await axios.get(`${BASE}/stats/timeline/${repoId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching timeline stats:", error.message);
    throw error;
  }
};
