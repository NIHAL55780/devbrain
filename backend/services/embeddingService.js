import axios from "axios";

export const getEmbeddings = async (texts) => {
  try {
    const response = await axios.post("http://localhost:8000/embed", {
      texts: texts,   // ✅ correct key + variable
    });

    return response.data.embeddings;

  } catch (error) {
    console.error("Error fetching embeddings:", error);
    return [];
  }
};