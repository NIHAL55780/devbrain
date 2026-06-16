import { useRef, useState } from "react";
import axios from "axios";
import Header from "./components/Header.jsx";
import RepoInput from "./components/RepoInput.jsx";
import QuestionInput from "./components/QuestionInput.jsx";
import AnswerCard from "./components/AnswerCard.jsx";
import SourceCard from "./components/SourceCard.jsx";
import { parseRepoLabel } from "./utils/parseRepo.js";

const api = axios.create({
  baseURL: "/api"
});

const newTurnId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `turn-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App() {
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
  const askInFlightRef = useRef(false);

  const indexedRepo = repoInfo?.label ?? null;
  const analyzeFailed = Boolean(analyzeStatus && !analyzed && !isAnalyzing);
  const canAsk = analyzed && question.trim().length > 0 && !isAsking;

  const handleClearChat = () => {
    setChatHistory([]);
    setSources([]);
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

    try {
      const response = await api.post("/repo/analyze", { repoUrl });
      const info = parseRepoLabel(repoUrl);
      setRepoInfo(info);
      setRepoId(response.data?.repoId || null);
      setAnalyzeStatus(response.data?.message || "Repository indexed successfully");
      setAnalyzed(true);
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to analyze repo";
      setAnalyzeStatus(message);
      setAnalyzed(false);
      setRepoInfo(null);
      setRepoId(null);
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

  return (
    <div className="app-shell min-h-screen px-4 py-8 text-slate-100 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <Header indexedRepo={indexedRepo} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          <QuestionInput
            question={question}
            setQuestion={setQuestion}
            onAsk={handleAsk}
            isAsking={isAsking}
            canAsk={canAsk}
            analyzed={analyzed}
            indexedRepo={indexedRepo}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <AnswerCard history={chatHistory} onClearChat={handleClearChat} />
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <h3 className="heading-font text-lg text-neon-cyan">Sources</h3>
              <span className="text-xs text-slate-400">Top matches</span>
            </div>
            <div className="mt-4 max-h-[min(420px,50vh)] space-y-4 overflow-y-auto pr-1">
              {sources.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {analyzed
                    ? "Ask a question to see retrieved code chunks."
                    : "Analyze a repo first."}
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
          </section>
        </div>
      </div>
    </div>
  );
}
