const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "how", "why", "what", "when",
  "where", "did", "does", "do", "this", "that", "with", "from", "into", "for",
  "and", "or", "in", "on", "at", "to", "of", "it", "be", "been", "has", "have",
  "had", "about", "over", "time", "change", "changed", "evolve", "evolved",
  "history", "introduced", "added", "used",
]);

export const extractKeywords = (text) => {
  if (!text?.trim()) return [];
  return [...new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
  )];
};

const scoreCommit = (commit, keywords) => {
  if (keywords.length === 0) return 1;

  const haystack = [
    commit.message,
    commit.paths,
    commit.summary,
    ...(commit.files?.map((file) => file.path) || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) {
      score += 1;
    }
  }
  return score;
};

export const filterCommitsForQuestion = (commits, question, limit = 12) => {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) {
    return commits
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit);
  }

  const scored = commits
    .map((commit) => ({
      commit,
      score: scoreCommit(commit, keywords),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.commit.date.localeCompare(b.commit.date);
    });

  if (scored.length === 0) {
    return commits
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit);
  }

  const selected = scored.slice(0, limit).map((item) => item.commit);
  selected.sort((a, b) => a.date.localeCompare(b.date));
  return selected;
};

export const selectCommitsForIndexing = (commits, maxCommits = 35) => {
  const sorted = commits
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, maxCommits);

  sorted.sort((a, b) => a.date.localeCompare(b.date));
  return sorted;
};
