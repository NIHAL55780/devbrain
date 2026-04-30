import { useMemo, useState } from "react";
import axios from "axios";
import Header from "./components/Header.jsx";
import RepoInput from "./components/RepoInput.jsx";
import QuestionInput from "./components/QuestionInput.jsx";
import AnswerCard from "./components/AnswerCard.jsx";
import SourceCard from "./components/SourceCard.jsx";

const api = axios.create({
  baseURL: "/api"
});

const formatAnswer = (answer) => {
  if (!answer) return "";
  return answer;
};

export default function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const canAsk = analyzed && question.trim().length > 0 && !isAsking;

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeStatus("");
    setAnswer("");
    setSources([]);
    setChatHistory([]);
    try {
      const response = await api.post("/repo/analyze", { repoUrl });
      setAnalyzeStatus(response.data?.message || "Repository indexed successfully");
      setAnalyzed(true);
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to analyze repo";
      setAnalyzeStatus(message);
      setAnalyzed(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAsk = async () => {
    if (!canAsk) return;
    setIsAsking(true);
    setAnswer("");
    try {
      const historyPayload = chatHistory.map((entry) => ({
        question: entry.question,
        answer: entry.answer
      }));
      const response = await api.post("/repo/ask", {
        question,
        history: historyPayload
      });
      const nextAnswer = response.data?.answer || "No answer returned";
      const nextSources = response.data?.sources || [];
      setAnswer(nextAnswer);
      setSources(nextSources);
      setChatHistory((prev) => [
        ...prev,
        {
          question: question.trim(),
          answer: nextAnswer,
          sources: nextSources
        }
      ]);
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to get answer";
      setAnswer(message);
      setSources([]);
    } finally {
      setIsAsking(false);
    }
  };

  const answerText = useMemo(() => formatAnswer(answer), [answer]);

  return (
    <div className="app-shell min-h-screen px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Header />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <RepoInput
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            analyzed={analyzed}
            analyzeStatus={analyzeStatus}
          />
          <QuestionInput
            question={question}
            setQuestion={setQuestion}
            onAsk={handleAsk}
            isAsking={isAsking}
            canAsk={canAsk}
            analyzed={analyzed}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <AnswerCard history={chatHistory} answer={answerText} isLoading={isAsking} />
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <h3 className="heading-font text-lg text-neon-cyan">Sources</h3>
              <span className="text-xs text-slate-400">Top matches</span>
            </div>
            <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-2">
              {sources.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Analyze a repo and ask a question to see sources.
                </p>
              ) : (
                sources.map((source, index) => (
                  <SourceCard key={`${source.file}-${index}`} source={source} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
