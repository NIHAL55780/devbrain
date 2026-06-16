import axios from "axios";
import { indexRepo, searchChunks } from "../services/embeddingService.js";
import { generateAnswer } from "../services/llmService.js";
import { setActiveRepoId, getActiveRepoId } from "../services/repoStore.js";
import { rerankChunks } from "../services/similarityService.js";

const parseGitHubRepoUrl = (repoUrl) => {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== "github.com") {
      return null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    if (!owner || !repo) {
      return null;
    }
    return { owner, repo };
  } catch (error) {
    return null;
  }
};

const makeRepoId = (owner, repo) => `${owner}_${repo}`;

export const askQuestion = async (req, res) => {
  try {
    const { question, history, repoId: bodyRepoId } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const repoId = bodyRepoId || getActiveRepoId();
    if (!repoId) {
      return res.status(400).json({ error: "No repo analyzed yet" });
    }

    const retrievedChunks = await searchChunks(repoId, question, 8);
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return res.status(400).json({ error: "No repo analyzed yet" });
    }

    const topChunks = rerankChunks(retrievedChunks, question, 8);
    if (!topChunks || topChunks.length === 0) {
      return res.status(404).json({ error: "No relevant chunks found" });
    }

    const answer = await generateAnswer(question, topChunks, history);

    res.json({
      success: true,
      question,
      repoId,
      answer,
      sources: topChunks.map((c) => ({
        file: c.path,
        score: c.score.toFixed(3),
        preview: c.chunk.slice(0, 120),
      })),
    });
  } catch (error) {
    console.error(error);
    if (error.response?.status) {
      return res.status(502).json({ error: "Vector search service unavailable" });
    }
    res.status(500).json({ error: "Error processing question" });
  }
};

const ALLOWED_EXTENSIONS = [".js", ".py", ".jsx", ".tsx", ".java", ".cpp", ".json", ".md"];

const isValidFile = (fileName) => {
  return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

const SKIP_FILE_NAMES = new Set(["INTERVIEW_PREP.md"]);

const shouldSkipFile = (filePath) => {
  const name = filePath.split("/").pop() || filePath;
  if (SKIP_FILE_NAMES.has(name)) return true;
  if (/INTERVIEW|CHEATSHEET|STUDY[_-]?GUIDE/i.test(name)) return true;
  return false;
};

const toFileText = (data) => {
  if (typeof data === "string") return data;
  if (data == null) return "";
  return JSON.stringify(data, null, 2);
};

const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const source = toFileText(text);
  const chunks = [];
  let start = 0;
  while (start < source.length) {
    const end = start + chunkSize;
    const piece = source.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = start + chunkSize - overlap;
  }
  return chunks;
};

const fetchRepoContents = async (url, allFiles = []) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });
    for (const item of data) {
      if (item.type === "file" && isValidFile(item.name)) {
        if (item.size > 50000) {
          continue;
        }
        if (item.path.startsWith(".github")) {
          continue;
        }
        if (shouldSkipFile(item.path)) {
          continue;
        }
        console.log("FILE:", item.path);
        try {
          const fileContent = await axios.get(item.download_url, {
            responseType: "text",
            transformResponse: [(data) => data],
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
            },
          });
          const fileText = toFileText(fileContent.data);
          if (!fileText.trim()) continue;

          const chunks = chunkText(fileText);

          chunks.forEach((chunk, index) => {
            allFiles.push({
              name: item.name,
              path: item.path,
              chunk: chunk,
              chunkIndex: index,
            });
          });
        } catch (err) {
          console.log("Skipping file:", item.path);
        }
      } else if (item.type === "dir") {
        await fetchRepoContents(item.url, allFiles);
      }
    }
    return allFiles;
  } catch (error) {
    console.error("error fetching repo :", error.message);
    return allFiles;
  }
};

export const analyzeRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: "repo url required" });
    }

    const parsedRepo = parseGitHubRepoUrl(repoUrl);
    if (!parsedRepo) {
      return res.status(400).json({ error: "Invalid GitHub URL" });
    }
    const { owner, repo } = parsedRepo;
    const repoId = makeRepoId(owner, repo);

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

    const allFiles = await fetchRepoContents(apiUrl);

    console.log("Chunks before indexing:", allFiles.length);

    if (allFiles.length === 0) {
      return res.status(400).json({ error: "No valid files found or repo is empty" });
    }

    const indexResult = await indexRepo(repoId, repoUrl, allFiles);

    setActiveRepoId(repoId);

    console.log("Indexed chunks:", indexResult.indexed, "collection:", indexResult.collection);

    res.json({
      message: "Repo analyzed successfully",
      repoId,
      totalChunks: indexResult.indexed,
    });
  } catch (error) {
    console.error(error);
    if (error.response?.status) {
      return res.status(502).json({ error: "Vector indexing service unavailable" });
    }
    res.status(500).json({ error: "error analyzing repo" });
  }
};
