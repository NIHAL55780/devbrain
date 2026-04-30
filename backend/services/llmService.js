import Groq from "groq-sdk";

export const generateAnswer = async (question, chunks) => {
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
`
        },
        {
          role: "user",
          content: `
Context:
${context}

Question:
${question}

Provide a clear, structured answer.
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