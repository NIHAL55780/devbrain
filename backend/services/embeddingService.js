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
