import {
  indexTimeline,
  searchTimeline,
  getTimelineStats,
} from "../services/embeddingService.js";
import { fetchRecentCommits, buildDiffContext } from "../services/gitHistoryService.js";
import { selectCommitsForIndexing } from "../services/commitFilterService.js";
import { summarizeCommits } from "../services/commitSummaryService.js";
import { generateEvolutionAnswer } from "../services/llmService.js";
import { getActiveRepoId } from "../services/repoStore.js";
import {
  parseGitHubRepoUrl,
  makeRepoId,
  githubCommitUrl,
} from "../utils/github.js";

export const buildTimeline = async (req, res) => {
  try {
    const { repoUrl, repoId: bodyRepoId } = req.body;
    const parsedRepo = repoUrl ? parseGitHubRepoUrl(repoUrl) : null;

    let repoId = bodyRepoId || getActiveRepoId();
    let owner;
    let repo;

    if (parsedRepo) {
      owner = parsedRepo.owner;
      repo = parsedRepo.repo;
      repoId = makeRepoId(owner, repo);
    } else if (repoId) {
      const parts = repoId.split("_");
      if (parts.length < 2) {
        return res.status(400).json({ error: "Invalid repoId" });
      }
      owner = parts[0];
      repo = parts.slice(1).join("_");
    } else {
      return res.status(400).json({ error: "repoUrl or repoId required" });
    }

    const resolvedRepoUrl = repoUrl || `https://github.com/${owner}/${repo}`;

    console.log(`Building timeline for ${owner}/${repo}...`);
    const rawCommits = await fetchRecentCommits(owner, repo);
    if (rawCommits.length === 0) {
      return res.status(400).json({ error: "No relevant commits found in recent history" });
    }

    const commitsToSummarize = selectCommitsForIndexing(rawCommits);
    console.log(`Summarizing ${commitsToSummarize.length} commits...`);

    const summarizedCommits = await summarizeCommits(commitsToSummarize, buildDiffContext);
    if (summarizedCommits.length === 0) {
      return res.status(400).json({ error: "No commits could be summarized" });
    }

    const indexResult = await indexTimeline(repoId, resolvedRepoUrl, summarizedCommits);
    console.log("Timeline indexed:", indexResult.indexed, "collection:", indexResult.collection);

    res.json({
      message: "Timeline built successfully",
      repoId,
      totalCommits: indexResult.indexed,
      collection: indexResult.collection,
    });
  } catch (error) {
    console.error(error);
    if (error.response?.status) {
      return res.status(502).json({ error: "Timeline indexing service unavailable" });
    }
    if (error.message === "GROQ_API_KEY missing") {
      return res.status(500).json({ error: "GROQ_API_KEY missing" });
    }
    res.status(500).json({ error: "Error building timeline" });
  }
};

export const askTimeline = async (req, res) => {
  try {
    const { question, history, repoId: bodyRepoId, repoUrl } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const repoId = bodyRepoId || getActiveRepoId();
    if (!repoId) {
      return res.status(400).json({ error: "No repo analyzed yet" });
    }

    const retrievedCommits = await searchTimeline(repoId, question, 12);
    if (!retrievedCommits || retrievedCommits.length === 0) {
      return res.status(400).json({
        error: "No timeline indexed yet. Build the evolution timeline first.",
      });
    }

    const answer = await generateEvolutionAnswer(question, retrievedCommits, history);

    let owner;
    let repo;
    const parsedRepo = repoUrl ? parseGitHubRepoUrl(repoUrl) : null;
    if (parsedRepo) {
      owner = parsedRepo.owner;
      repo = parsedRepo.repo;
    } else {
      const parts = repoId.split("_");
      owner = parts[0];
      repo = parts.slice(1).join("_");
    }

    res.json({
      success: true,
      question,
      repoId,
      answer,
      commits: retrievedCommits.map((commit) => ({
        sha: commit.commitSha,
        shortSha: commit.commitSha?.slice(0, 7),
        date: commit.date,
        author: commit.author,
        message: commit.message,
        paths: commit.paths,
        summary: commit.summary,
        score: commit.score?.toFixed?.(3) ?? commit.score,
        url: githubCommitUrl(owner, repo, commit.commitSha),
      })),
    });
  } catch (error) {
    console.error(error);
    if (error.response?.status) {
      return res.status(502).json({ error: "Timeline search service unavailable" });
    }
    res.status(500).json({ error: "Error processing evolution question" });
  }
};

export const timelineStatus = async (req, res) => {
  try {
    const repoId = req.query.repoId || getActiveRepoId();
    if (!repoId) {
      return res.json({ built: false, commitCount: 0 });
    }

    const stats = await getTimelineStats(repoId);
    if (!stats) {
      return res.json({ built: false, commitCount: 0, repoId });
    }

    res.json({
      built: true,
      repoId,
      commitCount: stats.commitCount,
      collection: stats.collection,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error checking timeline status" });
  }
};
