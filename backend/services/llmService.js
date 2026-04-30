import Groq from "groq-sdk";

const formatHistory = (history) => {
  if (!Array.isArray(history) || history.length === 0) {
    return "None";
  }
  const recent = history
    .filter((item) => item && item.question && item.answer)
    .slice(-5);
  if (recent.length === 0) {
    return "None";
  }
  return recent
    .map((item, index) => `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`)
    .join("\n\n");
};

export const generateAnswer = async (question, chunks, history = []) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY missing");
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const context = chunks
      .map((c) => `File: ${c.path}\n${c.chunk}`)
      .join("\n\n---\n\n");

    const conversation = formatHistory(history);

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `
      You are a senior software engineer analyzing a codebase.

      Rules:
      - Answer ONLY using the provided context
      - Be precise and technical
      - Mention file names when relevant
      - Do NOT hallucinate
      - If not found, say: "Not found in codebase"

      Output format (use this exact structure):
      Title: <short answer title>

      Overview:
      - <1-3 concise bullets>

      Key files:
      - <path>: <1 sentence describing its role>
      - <path>: <1 sentence describing its role>

      Details:
      - <2-4 bullets with concrete behaviors or logic>

      Gaps:
      - <list missing info from context or say "None">

      Constraints:
      - Do not use tables.
      - Keep each bullet under 2 lines.
      - Avoid nested lists.
      `
        },
        {
          role: "user",
          content: `
Context:
${context}

Conversation so far:
${conversation}

Question:
${question}

Follow the output format exactly.
`
        }
      ],
    });

    const answer = response.choices[0].message.content;

    if (!answer || answer.trim() === "") {
      return "No meaningful answer generated";
    }

    return answer;

  } catch (error) {
    console.error("Groq error:", error.message);
    return "Error generating answer";
  }
};