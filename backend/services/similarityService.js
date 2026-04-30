export const cosineSimilarity = (A, B) => {
  if (!A || !B || A.length !== B.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return dotProduct / (normA * normB);
};

export const getTopChunks = (queryEmbedding, allChunks, topK = 3) => {
  const MIN_SCORE = 0.0;
  console.log(MIN_SCORE); // 🔥 filter weak matches

  const scoredChunks = allChunks.map((item) => {
    const score = cosineSimilarity(queryEmbedding, item.embedding);
    return { ...item, score };
  });

  // 🔹 Sort by similarity
  scoredChunks.sort((a, b) => b.score - a.score);
  console.log(
    "Top scores:",
    scoredChunks.slice(0, 5).map(c => ({
      file: c.path,
      score: c.score
    }))
  );
  const seenFiles = new Set();
  const uniqueChunks = [];

  for (const chunk of scoredChunks) {
    // 🔥 Skip weak matches
    if (chunk.score < MIN_SCORE) continue;

    // 🔥 Ensure diversity (avoid same file repeated)
    if (!seenFiles.has(chunk.path)) {
      uniqueChunks.push(chunk);
      seenFiles.add(chunk.path);
    }

    if (uniqueChunks.length >= topK) break;
  }

  return uniqueChunks;
};