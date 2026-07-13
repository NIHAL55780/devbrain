import Groq from "groq-sdk";

const summarizeOne = async (groq, commit, diffContext) => {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: `You summarize git commits for a codebase evolution timeline.
Rules:
- Use ONLY the commit message and diff snippet provided
- Write 1-2 sentences: what changed and why (infer reason only if supported by message/diff)
- If reason is unclear, say "Reason unclear from commit message"
- Do not invent features or motivations
- Be concise and technical`,
      },
      {
        role: "user",
        content: `Commit: ${commit.commitSha.slice(0, 7)}
Date: ${commit.date}
Author: ${commit.author}
Message:
${commit.message}

Files changed:
${diffContext.paths}

Diff snippet:
${diffContext.diffSnippet || "No patch available"}`,
      },
    ],
    max_tokens: 180,
  });

  const summary = response.choices[0]?.message?.content?.trim();
  return summary || commit.message.split("\n")[0];
};

export const summarizeCommits = async (commits, buildDiffContext) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const summarized = [];

  for (const commit of commits) {
    const diffContext = buildDiffContext(commit);
    try {
      const summary = await summarizeOne(groq, commit, diffContext);
      summarized.push({
        commitSha: commit.commitSha,
        date: commit.date,
        author: commit.author,
        message: commit.message,
        paths: diffContext.paths,
        summary,
      });
    } catch (error) {
      console.error(`Summary failed for ${commit.commitSha}:`, error.message);
      summarized.push({
        commitSha: commit.commitSha,
        date: commit.date,
        author: commit.author,
        message: commit.message,
        paths: diffContext.paths,
        summary: commit.message.split("\n")[0],
      });
    }
  }

  return summarized;
};
