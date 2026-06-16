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

const applyPathBoost = (chunk, question) => {
  let score = chunk.score ?? 0;
  const path = chunk.path || "";

  for (const rule of PATH_BOOST_RULES) {
    if (rule.query.test(question) && rule.path.test(path)) {
      score += rule.boost;
      break;
    }
  }

  return score;
};

export const rerankChunks = (chunks, question, topK = 8) => {
  const scoredChunks = chunks.map((item) => ({
    ...item,
    score: applyPathBoost(item, question),
  }));

  scoredChunks.sort((a, b) => b.score - a.score);

  const seenFiles = new Set();
  const selected = [];

  for (const chunk of scoredChunks) {
    if (seenFiles.has(chunk.path)) continue;

    seenFiles.add(chunk.path);
    selected.push(chunk);

    if (selected.length >= topK) break;
  }

  return selected;
};
