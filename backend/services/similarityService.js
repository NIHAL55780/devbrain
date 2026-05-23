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

/** Boost chunks whose path matches question intent (e.g. fetch → hooks/useWeather.js) */
const PATH_BOOST_RULES = [
  {
    query: /\b(fetch|fetches|fetching|axios|request|api|openweather|endpoint)\b/i,
    path: /useweather|weather|hook|api|route|service|client/i,
    boost: 0.12,
  },
  {
    query: /\b(component|ui|render|jsx|screen)\b/i,
    path: /components?\/|\.jsx$/i,
    boost: 0.08,
  },
  {
    query: /\b(state|hook|context)\b/i,
    path: /hooks?\//i,
    boost: 0.08,
  },
  {
    query: /\b(server|backend|express|mongo)\b/i,
    path: /server\/|routes?\//i,
    boost: 0.1,
  },
];

const scoreChunk = (chunk, queryEmbedding, question = "") => {
  let score = cosineSimilarity(queryEmbedding, chunk.embedding);
  const path = chunk.path || "";

  for (const rule of PATH_BOOST_RULES) {
    if (rule.query.test(question) && rule.path.test(path)) {
      score += rule.boost;
      break;
    }
  }

  return score;
};

export const getTopChunks = (queryEmbedding, allChunks, topK = 8, question = "") => {
  const MIN_SCORE = 0.0;

  const scoredChunks = allChunks.map((item) => ({
    ...item,
    score: scoreChunk(item, queryEmbedding, question),
  }));

  scoredChunks.sort((a, b) => b.score - a.score);

  console.log(
    "Top raw scores:",
    scoredChunks.slice(0, 8).map((c) => ({
      file: c.path,
      score: Number(c.score.toFixed(3)),
    }))
  );

  const seenFiles = new Set();
  const selected = [];

  for (const chunk of scoredChunks) {
    if (chunk.score < MIN_SCORE) continue;
    if (seenFiles.has(chunk.path)) continue;

    seenFiles.add(chunk.path);
    selected.push(chunk);

    if (selected.length >= topK) break;
  }

  console.log(
    "Selected for LLM:",
    selected.map((c) => ({
      file: c.path,
      score: Number(c.score.toFixed(3)),
    }))
  );

  return selected;
};
