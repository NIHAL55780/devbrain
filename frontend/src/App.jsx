import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Header from "./components/Header.jsx";
import RepoInput from "./components/RepoInput.jsx";
import QuestionInput from "./components/QuestionInput.jsx";
import AnswerCard from "./components/AnswerCard.jsx";
import SourceCard from "./components/SourceCard.jsx";
import EvolutionPanel from "./components/EvolutionPanel.jsx";
import EvolutionResults from "./components/EvolutionResults.jsx";
import { parseRepoLabel } from "./utils/parseRepo.js";

const api = axios.create({
  baseURL: "/api"
});

const newTurnId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `turn-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const TABS = [
  { id: "code", label: "Code Q&A" },
  { id: "evolution", label: "Evolution" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("code");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState(null);
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [repoId, setRepoId] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const [timelineBuilt, setTimelineBuilt] = useState(false);
  const [timelineStatusText, setTimelineStatusText] = useState("");
  const [isBuildingTimeline, setIsBuildingTimeline] = useState(false);
  const [evolutionQuestion, setEvolutionQuestion] = useState("");
  const [evolutionHistory, setEvolutionHistory] = useState([]);
  const [evolutionCommits, setEvolutionCommits] = useState([]);
  const [isAskingEvolution, setIsAskingEvolution] = useState(false);

  const askInFlightRef = useRef(false);
  const evolutionInFlightRef = useRef(false);

  const indexedRepo = repoInfo?.label ?? null;
  const analyzeFailed = Boolean(analyzeStatus && !analyzed && !isAnalyzing);
  const canAsk = analyzed && question.trim().length > 0 && !isAsking;
  const canAskEvolution =
    timelineBuilt &&
    evolutionQuestion.trim().length > 0 &&
    !isAskingEvolution &&
    !isBuildingTimeline;

  const refreshTimelineStatus = useCallback(async (currentRepoId) => {
    if (!currentRepoId) {
      setTimelineBuilt(false);
      setTimelineStatusText("");
      return;
    }

    try {
      const response = await api.get("/repo/timeline/status", {
        params: { repoId: currentRepoId },
      });
      const built = Boolean(response.data?.built);
      const count = response.data?.commitCount || 0;
      setTimelineBuilt(built);
      setTimelineStatusText(
        built
          ? `Timeline ready — ${count} commit${count === 1 ? "" : "s"} indexed.`
          : "Build the timeline to ask evolution questions."
      );
    } catch {
      setTimelineBuilt(false);
      setTimelineStatusText("Could not check timeline status.");
    }
  }, []);

  useEffect(() => {
    if (repoId && analyzed) {
      refreshTimelineStatus(repoId);
    }
  }, [repoId, analyzed, refreshTimelineStatus]);

  const resetEvolutionState = () => {
    setTimelineBuilt(false);
    setTimelineStatusText("");
    setEvolutionQuestion("");
    setEvolutionHistory([]);
    setEvolutionCommits([]);
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setSources([]);
  };

  const handleClearEvolution = () => {
    setEvolutionHistory([]);
    setEvolutionCommits([]);
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeStatus("");
    setSources([]);
    setChatHistory([]);
    setAnalyzed(false);
    setRepoInfo(null);
    setRepoId(null);
    resetEvolutionState();

    try {
      const response = await api.post("/repo/analyze", { repoUrl });
      const info = parseRepoLabel(repoUrl);
      const nextRepoId = response.data?.repoId || null;
      setRepoInfo(info);
      setRepoId(nextRepoId);
      setAnalyzeStatus(
        response.data?.totalChunks
          ? `Indexed ${response.data.totalChunks} chunks.`
          : response.data?.message || "Repository indexed successfully"
      );
      setAnalyzed(true);
      await refreshTimelineStatus(nextRepoId);
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to analyze repo";
      setAnalyzeStatus(message);
      setAnalyzed(false);
      setRepoInfo(null);
      setRepoId(null);
      resetEvolutionState();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAsk = async () => {
    if (!canAsk || askInFlightRef.current) return;

    const askedQuestion = question.trim();
    const turnId = newTurnId();

    const historyPayload = chatHistory
      .filter((entry) => !entry.pending && entry.answer && !entry.isError)
      .map((entry) => ({
        question: entry.question,
        answer: entry.answer
      }));

    const pendingTurn = {
      id: turnId,
      question: askedQuestion,
      answer: "",
      sources: [],
      pending: true,
      isError: false
    };

    askInFlightRef.current = true;
    setIsAsking(true);
    setChatHistory((prev) => [...prev, pendingTurn]);
    setQuestion("");

    try {
      const response = await api.post("/repo/ask", {
        question: askedQuestion,
        history: historyPayload,
        repoId
      });
      const nextAnswer = response.data?.answer || "No answer returned";
      const nextSources = response.data?.sources || [];

      setSources(nextSources);
      setChatHistory((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                answer: nextAnswer,
                sources: nextSources,
                pending: false,
                isError: false
              }
            : turn
        )
      );
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to get answer";
      setSources([]);
      setChatHistory((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? { ...turn, answer: message, sources: [], pending: false, isError: true }
            : turn
        )
      );
    } finally {
      askInFlightRef.current = false;
      setIsAsking(false);
    }
  };

  const handleBuildTimeline = async () => {
    if (!analyzed || !repoUrl.trim() || isBuildingTimeline) return;

    setIsBuildingTimeline(true);
    setTimelineStatusText("Fetching commits and building timeline…");

    try {
      const response = await api.post("/repo/timeline/build", { repoUrl, repoId });
      const count = response.data?.totalCommits || 0;
      setTimelineBuilt(true);
      setTimelineStatusText(
        count
          ? `Timeline ready — ${count} commit${count === 1 ? "" : "s"} indexed.`
          : response.data?.message || "Timeline built successfully"
      );
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to build timeline";
      setTimelineBuilt(false);
      setTimelineStatusText(message);
    } finally {
      setIsBuildingTimeline(false);
    }
  };

  const handleAskEvolution = async () => {
    if (!canAskEvolution || evolutionInFlightRef.current) return;

    const askedQuestion = evolutionQuestion.trim();
    const turnId = newTurnId();

    const historyPayload = evolutionHistory
      .filter((entry) => !entry.pending && entry.answer && !entry.isError)
      .map((entry) => ({
        question: entry.question,
        answer: entry.answer
      }));

    const pendingTurn = {
      id: turnId,
      question: askedQuestion,
      answer: "",
      commits: [],
      pending: true,
      isError: false
    };

    evolutionInFlightRef.current = true;
    setIsAskingEvolution(true);
    setEvolutionHistory((prev) => [...prev, pendingTurn]);
    setEvolutionQuestion("");

    try {
      const response = await api.post("/repo/timeline/ask", {
        question: askedQuestion,
        history: historyPayload,
        repoId,
        repoUrl
      });
      const nextAnswer = response.data?.answer || "No answer returned";
      const nextCommits = response.data?.commits || [];

      setEvolutionCommits(nextCommits);
      setEvolutionHistory((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                answer: nextAnswer,
                commits: nextCommits,
                pending: false,
                isError: false
              }
            : turn
        )
      );
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to get evolution answer";
      setEvolutionCommits([]);
      setEvolutionHistory((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? { ...turn, answer: message, commits: [], pending: false, isError: true }
            : turn
        )
      );
    } finally {
      evolutionInFlightRef.current = false;
      setIsAskingEvolution(false);
    }
  };

  return (
    <div className="app-shell min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Header indexedRepo={indexedRepo} />

        <RepoInput
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          analyzed={analyzed}
          analyzeStatus={analyzeStatus}
          indexedRepo={indexedRepo}
          analyzeFailed={analyzeFailed}
        />

        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-surface-raised text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "code" ? (
          <>
            <QuestionInput
              question={question}
              setQuestion={setQuestion}
              onAsk={handleAsk}
              isAsking={isAsking}
              canAsk={canAsk}
              analyzed={analyzed}
              indexedRepo={indexedRepo}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
              <AnswerCard history={chatHistory} onClearChat={handleClearChat} />
              <aside className="panel p-5">
                <h2 className="text-sm font-medium text-ink">Sources</h2>
                <p className="mt-1 text-xs text-ink-faint">Files retrieved for the last answer</p>
                <div className="mt-4 max-h-[min(480px,55vh)] space-y-2 overflow-y-auto">
                  {sources.length === 0 ? (
                    <p className="text-xs leading-relaxed text-ink-faint">
                      {analyzed
                        ? "Ask something — matching code chunks appear here."
                        : "Index a repo to get started."}
                    </p>
                  ) : (
                    sources.map((source, index) => (
                      <SourceCard
                        key={`${source.file}-${index}`}
                        source={source}
                        repoInfo={repoInfo}
                      />
                    ))
                  )}
                </div>
              </aside>
            </div>
          </>
        ) : (
          <>
            <EvolutionPanel
              analyzed={analyzed}
              indexedRepo={indexedRepo}
              timelineBuilt={timelineBuilt}
              timelineStatusText={timelineStatusText}
              isBuildingTimeline={isBuildingTimeline}
              onBuildTimeline={handleBuildTimeline}
              evolutionQuestion={evolutionQuestion}
              setEvolutionQuestion={setEvolutionQuestion}
              onAskEvolution={handleAskEvolution}
              isAskingEvolution={isAskingEvolution}
              canAskEvolution={canAskEvolution}
            />

            <EvolutionResults
              history={evolutionHistory}
              commits={evolutionCommits}
              onClearChat={handleClearEvolution}
            />
          </>
        )}
      </div>
    </div>
  );
}
