"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import {
  Briefcase,
  FileText,
  BookOpen,
  MessageSquare,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Sparkles,
  RefreshCw,
  Layers,
  Award,
  Send,
  Terminal,
  X,
} from "lucide-react";
import { ResumeAnalysis } from "@/lib/agents";
import { JobMatch } from "@/lib/agents";
import { LearningPlan } from "@/lib/agents";

interface MessagePart {
  type: string;
  text?: string;
}

interface ChatUIMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content?: string;
  parts?: MessagePart[];
}

export default function Home() {
  // --- Estados de Navegação e Globais ---
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "resume" | "match" | "plan" | "interview"
  >("dashboard");

  // --- Estados do Currículo (Resume) ---
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFilename, setResumeFilename] = useState<string>("");
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(
    null,
  );
  const [isAnalyzingResume, setIsAnalyzingResume] = useState<boolean>(false);
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "text">(
    "upload",
  );
  const [pastedResumeText, setPastedResumeText] = useState<string>("");

  // --- Estados do Match de Vaga ---
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobCompany, setJobCompany] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [isMatchingJob, setIsMatchingJob] = useState<boolean>(false);
  const [jobMatchResult, setJobMatchResult] = useState<JobMatch | null>(null);

  // --- Estados do Plano de Estudos (RAG) ---
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // --- Estados do Simulador de Entrevista ---
  const [interviewCategory, setInterviewCategory] = useState<string>("React");
  const [interviewSeniority, setInterviewSeniority] = useState<string>("Pleno");
  const [isInterviewStarted, setIsInterviewStarted] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // --- Estados de Ingestão de Conhecimento ---
  const [isSyncingKnowledge, setIsSyncingKnowledge] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    processedDocuments: number;
    totalChunks: number;
    errors: string[];
  } | null>(null);

  // Refs de UI
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Inicialização do Hook de Chat do Vercel AI SDK ---
  const {
    messages,
    setMessages,
    sendMessage,
    status,
  } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/interview/chat",
      body: {
        category: interviewCategory,
        seniority: interviewSeniority,
      },
    }),
    onFinish: () => {
      // Auto scroll quando chega resposta
      scrollToBottom();
    },
  });

  const isChatLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | undefined) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const currentInput = input;
    setInput("");
    await sendMessage({ text: currentInput });
  };

  // Auto scroll para o final das mensagens do chat
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // --- Ações de Ingestão (Sync) ---
  const handleSyncKnowledge = async () => {
    setIsSyncingKnowledge(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/ingest");
      const data = await res.json();
      setSyncResult(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro de rede ao conectar com o serviço de ingestão";
      setSyncResult({
        success: false,
        processedDocuments: 0,
        totalChunks: 0,
        errors: [errorMessage],
      });
    } finally {
      setIsSyncingKnowledge(false);
    }
  };

  // --- Ações do Currículo ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setResumeFilename(file.name);
    setIsAnalyzingResume(true);
    setResumeAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao analisar currículo.");

      setResumeText(data.text);
      setResumeAnalysis(data.analysis);
      // Pular para aba de análise se deu certo
      setActiveTab("resume");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Falha na análise: ${errorMessage}`);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleTextResumeSubmit = async () => {
    if (!pastedResumeText.trim()) {
      alert("Por favor, digite ou cole o texto do seu currículo.");
      return;
    }

    setIsAnalyzingResume(true);
    setResumeAnalysis(null);
    setResumeFilename("curriculo-digitado.txt");

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedResumeText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao analisar currículo.");

      setResumeText(data.text);
      setResumeAnalysis(data.analysis);
      setActiveTab("resume");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Falha na análise: ${errorMessage}`);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // --- Ações de Match de Vaga ---
  const handleJobMatchSubmit = async () => {
    if (!resumeText) {
      alert(
        'Por favor, faça o upload ou cole seu currículo na aba de "Currículo" primeiro!',
      );
      setActiveTab("resume");
      return;
    }

    if (!jobTitle || !jobDescription) {
      alert("Por favor, preencha o Título da Vaga e a Descrição da Vaga.");
      return;
    }

    setIsMatchingJob(true);
    setJobMatchResult(null);

    try {
      const res = await fetch("/api/job/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          title: jobTitle,
          company: jobCompany,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar o match.");

      setJobMatchResult(data.matchResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Falha no match: ${errorMessage}`);
    } finally {
      setIsMatchingJob(false);
    }
  };

  // --- Ações de Plano de Estudos ---
  const handleGenerateStudyPlan = async (skillsToUse: string[]) => {
    if (skillsToUse.length === 0) {
      alert("Nenhuma habilidade ausente fornecida para criar o plano.");
      return;
    }

    setIsGeneratingPlan(true);
    setLearningPlan(null);

    try {
      const res = await fetch("/api/learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missingSkills: skillsToUse,
          resumeSummary: resumeAnalysis
            ? `Candidato de nível ${resumeAnalysis.seniority}`
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar o plano.");

      setLearningPlan(data.learningPlan);
      setActiveTab("plan");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Falha ao gerar plano de estudos: ${errorMessage}`);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // --- Ações do Simulador de Entrevista ---
  const handleStartInterview = async () => {
    setMessages([]); // limpa mensagens antigas
    setIsInterviewStarted(true);

    // Dispara a mensagem inicial para acionar o prompt inicial do agente de IA.
    // Usamos o método sendMessage oficial do Vercel AI SDK para fazer isso de forma limpa e assíncrona.
    setTimeout(() => {
      sendMessage({
        text: "Estou pronto para iniciar a simulação de entrevista técnica.",
      });
    }, 200);
  };

  const handleStopInterview = () => {
    setIsInterviewStarted(false);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* --- HEADER --- */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-400">
              AI Career Coach
            </h1>
            <p className="text-xs text-slate-400">
              RAG-Powered AI Mentoring & Ingestion Platform
            </p>
          </div>
        </div>

        {/* --- NAVIGATION LINKS --- */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
          >
            <Layers className="w-4 h-4" /> Painel
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "resume" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
          >
            <FileText className="w-4 h-4" /> 1. Currículo
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "match" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
          >
            <Briefcase className="w-4 h-4" /> 2. Match Vaga
          </button>
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "plan" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
          >
            <BookOpen className="w-4 h-4" /> 3. Plano Estudos
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "interview" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
          >
            <MessageSquare className="w-4 h-4" /> 4. Simulador
          </button>
        </nav>

        {/* --- QUICK ACTIONS --- */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncKnowledge}
            disabled={isSyncingKnowledge}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isSyncingKnowledge
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
            }`}
            title="Sincronizar base de conhecimento local com Supabase pgvector"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncingKnowledge ? "animate-spin" : ""}`}
            />
            {isSyncingKnowledge ? "Sincronizando..." : "Sincronizar RAG"}
          </button>
        </div>
      </header>

      {/* --- NOTIFICAÇÃO MOBILE NAV --- */}
      <div className="md:hidden flex overflow-x-auto gap-1 bg-slate-900 p-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          Painel
        </button>
        <button
          onClick={() => setActiveTab("resume")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === "resume" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          1. Currículo
        </button>
        <button
          onClick={() => setActiveTab("match")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === "match" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          2. Match Vaga
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === "plan" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          3. Plano Estudos
        </button>
        <button
          onClick={() => setActiveTab("interview")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === "interview" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          4. Simulador
        </button>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        {/* --- ABA 1: PAINEL / DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LADO ESQUERDO: INFOS E BOAS VINDAS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-36 h-36 text-indigo-500" />
                </div>
                <div className="relative flex flex-col gap-4">
                  <div className="bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1 rounded-full text-indigo-300 text-xs font-semibold w-max flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Próxima Geração de IA
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                    Impulsione sua Carreira em TI com a nossa Mentoria por IA
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
                    Utilize o poder das tecnologias mais avançadas de
                    inteligência artificial (RAG com banco vetorial pgvector no
                    Supabase e modelos GPT-4o) para analisar seus gaps, traçar
                    planos de estudo perfeitos e simular desafios de entrevistas
                    reais.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => setActiveTab("resume")}
                      className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      Começar agora <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#about"
                      className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all border border-slate-850"
                    >
                      Como funciona?
                    </a>
                  </div>
                </div>
              </div>

              {/* FLUXO PASSO A PASSO */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Fluxo de
                  Crescimento Técnico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div className="bg-indigo-500/10 text-indigo-400 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      1
                    </div>
                    <h4 className="font-semibold text-sm text-slate-200">
                      Suba o Currículo
                    </h4>
                    <p className="text-xs text-slate-400">
                      Analise suas habilidades e obtenha sua senioridade do
                      mercado.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div className="bg-indigo-500/10 text-indigo-400 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      2
                    </div>
                    <h4 className="font-semibold text-sm text-slate-200">
                      Escolha a Vaga
                    </h4>
                    <p className="text-xs text-slate-400">
                      Insira a descrição da vaga desejada para calcular o score.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div className="bg-indigo-500/10 text-indigo-400 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      3
                    </div>
                    <h4 className="font-semibold text-sm text-slate-200">
                      Plano de Estudos
                    </h4>
                    <p className="text-xs text-slate-400">
                      Gere um cronograma baseado em RAG para as skills ausentes.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div className="bg-indigo-500/10 text-indigo-400 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      4
                    </div>
                    <h4 className="font-semibold text-sm text-slate-200">
                      Simule Entrevistas
                    </h4>
                    <p className="text-xs text-slate-400">
                      Treine suas respostas com recrutadores virtuais exigentes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: STATUS DO BANCO RAG E INFOS */}
            <div className="flex flex-col gap-6">
              {/* CARD DE SINCRO DA BASE RAG */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Cpu className="w-4 h-4 text-emerald-400" /> Base de
                    Conhecimento RAG
                  </h3>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Ativo (pgvector)
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Nossa base de conhecimento local possui arquivos markdown
                  categorizados sobre{" "}
                  <b>React, Node.js, AWS, PostgreSQL, System Design</b> e{" "}
                  <b>Behavioral</b>. Ao sincronizar, o sistema cria
                  representações vetoriais de 1536 dimensões via OpenAI
                  Embeddings no Supabase PostgreSQL.
                </p>

                <button
                  onClick={handleSyncKnowledge}
                  disabled={isSyncingKnowledge}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isSyncingKnowledge
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                  }`}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isSyncingKnowledge ? "animate-spin" : ""}`}
                  />
                  {isSyncingKnowledge
                    ? "Sincronizando Base..."
                    : "Sincronizar Arquivos Locais"}
                </button>

                {/* RESULTADOS DA SINCRO */}
                {syncResult && (
                  <div
                    className={`mt-2 p-3.5 rounded-xl text-xs border ${
                      syncResult.success
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/5 border-red-500/20 text-red-300"
                    }`}
                  >
                    {syncResult.success ? (
                      <div className="flex flex-col gap-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{" "}
                          Sincronização Concluída!
                        </p>
                        <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5 text-[11px] text-slate-300">
                          <li>
                            Documentos lidos: {syncResult.processedDocuments}
                          </li>
                          <li>Chunks indexados: {syncResult.totalChunks}</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />{" "}
                          Falhas encontradas:
                        </p>
                        <div className="max-h-24 overflow-y-auto mt-1 flex flex-col gap-1 text-[11px] text-slate-300 scrollbar-thin">
                          {syncResult.errors.map((err, i) => (
                            <p key={i}>• {err}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CARD DE CURRÍCULO CARREGADO */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> Sessão Ativa
                </h3>
                {resumeAnalysis ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <p className="text-xs font-semibold text-slate-300 truncate">
                          {resumeFilename || "curriculo.txt"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Pronto para Match e Estudos
                        </p>
                      </div>
                      <span className="bg-indigo-600/10 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {resumeAnalysis.seniority}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400">
                        Competências:
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                        {resumeAnalysis.skills.slice(0, 5).map((skill, i) => (
                          <span
                            key={i}
                            className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {resumeAnalysis.skills.length > 5 && (
                          <span className="text-[10px] text-slate-500 pl-1">
                            +{resumeAnalysis.skills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                      <button
                        onClick={() => setActiveTab("match")}
                        className="py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold"
                      >
                        Fazer Match
                      </button>
                      <button
                        onClick={() =>
                          handleGenerateStudyPlan(resumeAnalysis.weaknesses)
                        }
                        disabled={isGeneratingPlan}
                        className="py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                      >
                        Estudar Gaps
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center gap-3">
                    <div className="bg-slate-950 p-3 rounded-full border border-slate-800 text-slate-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Nenhum currículo ativo carregado nesta sessão.
                    </p>
                    <button
                      onClick={() => setActiveTab("resume")}
                      className="text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1"
                    >
                      Carregar meu currículo{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA 2: ANALISAR CURRÍCULO --- */}
        {activeTab === "resume" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-400" /> Analisador de
                Currículo (Agent 1)
              </h2>
              <p className="text-slate-400 text-sm">
                Envie seu currículo nos formatos <b>PDF</b>, <b>DOCX</b> ou{" "}
                <b>Texto</b>. Nosso agente extrairá suas habilidades técnicas e
                soft skills de forma automatizada para desenhar sua trilha
                profissional.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ÁREA DE INPUT DO CURRÍCULO */}
              <div className="flex flex-col gap-6">
                {/* SWITCH ENTRE UPLOAD E TEXTO COLA */}
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-850 flex text-xs">
                  <button
                    onClick={() => setResumeInputMode("upload")}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${resumeInputMode === "upload" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Upload de Arquivo (PDF/DOCX)
                  </button>
                  <button
                    onClick={() => setResumeInputMode("text")}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${resumeInputMode === "text" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Colar Texto Bruto
                  </button>
                </div>

                {resumeInputMode === "upload" ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all ${
                      isAnalyzingResume
                        ? "border-indigo-500/50 bg-indigo-500/5"
                        : "border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/50 bg-slate-900/20"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      disabled={isAnalyzingResume}
                    />

                    {isAnalyzingResume ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            Extraindo e analisando currículo...
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Isso pode levar de 5 a 15 segundos
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-slate-900 p-4 rounded-full border border-slate-800 text-indigo-400 shadow-md">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            Clique para selecionar seu arquivo
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PDF, DOCX ou TXT de até 10MB
                          </p>
                        </div>
                        {resumeFilename && (
                          <div className="mt-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300">
                            Selecionado: {resumeFilename}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <textarea
                      placeholder="Cole aqui todas as informações do seu currículo técnico..."
                      rows={12}
                      value={pastedResumeText}
                      onChange={(e) => setPastedResumeText(e.target.value)}
                      disabled={isAnalyzingResume}
                      className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                    <button
                      onClick={handleTextResumeSubmit}
                      disabled={isAnalyzingResume || !pastedResumeText.trim()}
                      className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                        isAnalyzingResume
                          ? "bg-indigo-600/40 text-indigo-200 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                      }`}
                    >
                      {isAnalyzingResume ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                          Analisando Currículo...
                        </>
                      ) : (
                        <>
                          Analisar Currículo <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* VISUALIZADOR DE TEXTO EXTRAÍDO */}
                {resumeText && (
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Texto Extraído do Currículo</span>
                      <button
                        onClick={() => {
                          setResumeText("");
                          setResumeAnalysis(null);
                          setResumeFilename("");
                        }}
                        className="text-slate-500 hover:text-slate-300"
                        title="Limpar currículo ativo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </h4>
                    <div className="max-h-48 overflow-y-auto text-[11px] font-mono text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 scrollbar-thin">
                      {resumeText}
                    </div>
                  </div>
                )}
              </div>

              {/* LADO DIREITO: EXIBIÇÃO DA ANÁLISE DO AGENTE */}
              <div className="lg:col-span-2">
                {resumeAnalysis ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-lg">
                    {/* TOP DA ANÁLISE */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-lg text-white">
                            Análise de Perfil Executada
                          </h3>
                          <p className="text-xs text-slate-400">
                            Resultados estruturados extraídos pelo Agent 1
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          Senioridade Atribuída:
                        </span>
                        <span className="bg-indigo-600 text-white font-black text-sm px-4 py-1.5 rounded-xl shadow-md">
                          {resumeAnalysis.seniority}
                        </span>
                      </div>
                    </div>

                    {/* HABILIDADES DETECTADAS */}
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200 text-sm">
                        Habilidades & Tecnologias Dominadas:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeAnalysis.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-slate-800 text-slate-200 border border-slate-700/60 text-xs px-3 py-1 rounded-lg font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* COLUNAS DUPLAS: PONTOS FORTES VS GAPS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                      {/* PONTOS FORTES */}
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 flex flex-col gap-3">
                        <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4.5 h-4.5" /> Pontos Fortes
                          do Perfil
                        </h4>
                        <ul className="flex flex-col gap-2.5 text-xs text-slate-300">
                          {resumeAnalysis.strengths.map((str, i) => (
                            <li key={i} className="flex gap-2 leading-relaxed">
                              <span className="text-emerald-400 font-bold">
                                •
                              </span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* GAPS TÉCNICOS */}
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 flex flex-col gap-3">
                        <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4.5 h-4.5" /> Gaps
                          Técnicos / Oportunidades
                        </h4>
                        <ul className="flex flex-col gap-2.5 text-xs text-slate-300">
                          {resumeAnalysis.weaknesses.map((weak, i) => (
                            <li key={i} className="flex gap-2 leading-relaxed">
                              <span className="text-amber-400 font-bold">
                                •
                              </span>
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* SEÇÃO DE AÇÃO */}
                    <div className="border-t border-slate-800 pt-5 flex flex-wrap gap-3 items-center justify-between">
                      <div className="text-xs text-slate-400 max-w-sm">
                        Com base nos gaps técnicos identificados, você pode
                        gerar um cronograma de estudos sob medida com nossa base
                        de conhecimento (RAG).
                      </div>
                      <button
                        onClick={() =>
                          handleGenerateStudyPlan(resumeAnalysis.weaknesses)
                        }
                        disabled={isGeneratingPlan}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        {isGeneratingPlan ? (
                          <>
                            <RefreshCw className="w-4.5 h-4.5 animate-spin" />{" "}
                            Gerando Plano...
                          </>
                        ) : (
                          <>
                            Gerar Plano de Estudos RAG{" "}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 h-full min-h-80">
                    <div className="bg-slate-900 p-4 rounded-full border border-slate-800 text-slate-600">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="font-bold text-white text-base">
                        Aguardando Envio de Currículo
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Faça o upload do seu arquivo de currículo técnico do
                        lado esquerdo para extrair suas competências e
                        classificações do Agent 1.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA 3: MATCH DE VAGA --- */}
        {activeTab === "match" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-indigo-400" /> Comparador de
                Vagas (Agent 2)
              </h2>
              <p className="text-slate-400 text-sm">
                Forneça a descrição e requisitos da vaga para a qual você deseja
                aplicar. Nosso agente calculará o score de adequação de forma
                cirúrgica e identificará o que falta no seu currículo.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FORMULÁRIO DE CADASTRO DA VAGA */}
              <div className="flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
                    Informações da Vaga
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Título do Cargo*
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Desenvolvedor React Sênior, Tech Lead..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Empresa (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Google, Nubank, Startup X..."
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Descrição Bruta da Vaga*
                    </label>
                    <textarea
                      placeholder="Cole aqui os requisitos da vaga, atribuições, tecnologias obrigatórias e desejáveis de forma completa..."
                      rows={8}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleJobMatchSubmit}
                    disabled={isMatchingJob || !jobTitle || !jobDescription}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isMatchingJob
                        ? "bg-indigo-600/40 text-indigo-200 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                    }`}
                  >
                    {isMatchingJob ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                        Calculando Match...
                      </>
                    ) : (
                      <>
                        Verificar Compatibilidade{" "}
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* EXIBIÇÃO DOS RESULTADOS DO MATCH */}
              <div className="lg:col-span-2">
                {jobMatchResult ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-lg">
                    {/* HEADER RESULTADOS */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-lg text-white">
                            {jobTitle}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {jobCompany || "Empresa Informada"}
                          </p>
                        </div>
                      </div>

                      {/* GAUGE DE SCORE */}
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                          {/* Um circulo colorido simples */}
                          <div
                            className={`absolute inset-0 rounded-full border-4 ${
                              jobMatchResult.score >= 80
                                ? "border-emerald-500"
                                : jobMatchResult.score >= 50
                                  ? "border-amber-500"
                                  : "border-red-500"
                            } clip-half`}
                          ></div>
                          <span className="text-sm font-black text-white">
                            {jobMatchResult.score}%
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black">
                            Aderência
                          </p>
                          <p className="text-xs font-semibold text-slate-300">
                            {jobMatchResult.score >= 80
                              ? "Excelente Fit!"
                              : jobMatchResult.score >= 50
                                ? "Bom Potencial"
                                : "Gaps Críticos"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* COLUNA ESQUERDA/DIREITA: SKILLS ENCONTRADAS VS SKILLS AUSENTES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SKILLS ENCONTRADAS (MATCHES) */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3">
                        <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />{" "}
                          Skills Alinhadas (
                          {jobMatchResult.matchingSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {jobMatchResult.matchingSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/15 text-xs px-2.5 py-1 rounded-lg font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {jobMatchResult.matchingSkills.length === 0 && (
                            <p className="text-xs text-slate-500 italic">
                              Nenhuma skill perfeitamente coincidente mapeada.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* SKILLS AUSENTES (GAPS) */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3">
                        <h4 className="font-bold text-red-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4.5 h-4.5 text-red-500" />{" "}
                          Skills Ausentes / Fracas (
                          {jobMatchResult.missingSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {jobMatchResult.missingSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="bg-red-500/10 text-red-300 border border-red-500/15 text-xs px-2.5 py-1 rounded-lg font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {jobMatchResult.missingSkills.length === 0 && (
                            <p className="text-xs text-emerald-400 font-bold italic">
                              Nenhum gap detectado!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RECOMENDAÇÕES */}
                    <div className="flex flex-col gap-3 mt-1">
                      <h4 className="font-bold text-slate-200 text-sm">
                        Ações Corretivas Recomendadas:
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {jobMatchResult.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex gap-3 text-xs leading-relaxed text-slate-300"
                          >
                            <span className="bg-indigo-600/10 text-indigo-400 font-black text-[10px] w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-indigo-500/15">
                              {i + 1}
                            </span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SEÇÃO AÇÃO PLANO DE ESTUDO */}
                    {jobMatchResult.missingSkills.length > 0 && (
                      <div className="border-t border-slate-800 pt-5 flex flex-wrap gap-3 items-center justify-between">
                        <div className="text-xs text-slate-400 max-w-sm">
                          Deseja acelerar a correção dessas lacunas técnicas? O
                          Agent 3 pode criar uma trilha integrada baseada em RAG
                          no nosso banco.
                        </div>
                        <button
                          onClick={() =>
                            handleGenerateStudyPlan(
                              jobMatchResult.missingSkills,
                            )
                          }
                          disabled={isGeneratingPlan}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          {isGeneratingPlan ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                              Gerando Plano...
                            </>
                          ) : (
                            <>
                              Gerar Trilha de Estudos para Gaps{" "}
                              <BookOpen className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 h-full min-h-80">
                    <div className="bg-slate-900 p-4 rounded-full border border-slate-800 text-slate-600">
                      <Briefcase className="w-10 h-10" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="font-bold text-white text-base">
                        Pronto para Análise Comparativa
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Preencha o formulário com a vaga desejada à esquerda.
                        Nós buscaremos seu currículo carregado automaticamente
                        para avaliar seu encaixe.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA 4: PLANO DE ESTUDOS --- */}
        {activeTab === "plan" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" /> Plano de
                Estudos Personalizado (Agent 3 - RAG)
              </h2>
              <p className="text-slate-400 text-sm">
                Cronograma semanal estruturado por IA de forma dinâmica. O
                agente utiliza a busca vetorial para ler nossa base de
                conhecimento interna e garantir que seu material de apoio seja
                altamente qualificado e referenciado.
              </p>
            </div>

            {/* SEGUNDO ACIONADOR MANUAL SE QUISER TESTAR SKILLS DE FORMA AVULSA */}
            {!learningPlan && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto text-center flex flex-col items-center gap-5 shadow-lg">
                <div className="bg-slate-950 p-4 rounded-full border border-slate-800 text-slate-600">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Criar Trilha Manual
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md">
                    Se você não possui dados de match ou quer forçar um estudo
                    personalizado sobre um conjunto específico de competências,
                    digite-as abaixo separadas por vírgula.
                  </p>
                </div>
                <div className="w-full flex gap-2 max-w-md">
                  <input
                    type="text"
                    id="manual-skills"
                    placeholder="Ex: PostgreSQL, React Hooks, AWS, System Design..."
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={() => {
                      const inputVal = (
                        document.getElementById(
                          "manual-skills",
                        ) as HTMLInputElement
                      )?.value;
                      if (!inputVal) {
                        alert("Digite pelo menos uma habilidade.");
                        return;
                      }
                      const skills = inputVal
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      handleGenerateStudyPlan(skills);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Gerar Trilha
                  </button>
                </div>
              </div>
            )}

            {isGeneratingPlan && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-5 max-w-lg mx-auto shadow-xl">
                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    Gerando Plano RAG...
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Pesquisando na base de dados PostgreSQL pgvector,
                    recuperando blocos de conhecimento de alto valor e
                    orquestrando o modelo estruturado. Por favor, aguarde.
                  </p>
                </div>
              </div>
            )}

            {/* EXIBIÇÃO DO PLANO DE ESTUDOS */}
            {learningPlan && !isGeneratingPlan && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* TIMELINE PRINCIPAL */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-extrabold text-white text-lg">
                          Seu Cronograma Semanal de Estudos
                        </h3>
                        <p className="text-xs text-slate-400">
                          Trilha de estudos focada e otimizada por Inteligência
                          Artificial
                        </p>
                      </div>

                      <button
                        onClick={() => setLearningPlan(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white border border-slate-850"
                      >
                        Refazer Trilha
                      </button>
                    </div>

                    {/* LISTAGEM DE SEMANAS TIMELINE */}
                    <div className="flex flex-col gap-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-indigo-900/40">
                      {learningPlan.weeks.map((week, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 md:gap-6 relative group"
                        >
                          {/* BOLINHA NÚMERO DA SEMANA */}
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 border-4 border-slate-900 flex items-center justify-center shrink-0 z-10 font-black text-sm text-white group-hover:bg-indigo-500 transition-all shadow-md">
                            S{week.weekNumber}
                          </div>

                          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex-1 flex flex-col gap-4">
                            <div>
                              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-500/15">
                                Semana {week.weekNumber}
                              </span>
                              <h4 className="font-black text-base text-white mt-1">
                                {week.topic}
                              </h4>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                <b>Objetivo:</b> {week.objective}
                              </p>
                            </div>

                            {/* TAREFAS */}
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                                Tarefas Ativas
                              </span>
                              <ul className="flex flex-col gap-2">
                                {week.tasks.map((task, i) => (
                                  <li
                                    key={i}
                                    className="flex gap-2.5 text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/60"
                                  >
                                    <span className="bg-slate-800 text-indigo-400 font-black text-[9px] w-4 h-4 rounded-md flex items-center justify-center shrink-0">
                                      ✓
                                    </span>
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* RECURSOS E CONHECIMENTO DO RAG */}
                            {week.resources.length > 0 && (
                              <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-900">
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                                  Fontes & Materiais de Apoio
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {week.resources.map((res, i) => (
                                    <span
                                      key={i}
                                      className="bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 text-[10px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />{" "}
                                      {res}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CONSELHOS ADICIONAIS */}
                <div className="flex flex-col gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />{" "}
                      Conselhos do Tutor IA
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850 italic">
                      &ldquo;{learningPlan.additionalAdvice}&rdquo;
                    </p>

                    <div className="flex flex-col gap-2 text-xs text-slate-400 border-t border-slate-800 pt-4 leading-relaxed">
                      <p>
                        💡 <b>Dica de Sucesso:</b> Ao concluir o cronograma,
                        selecione a categoria de estudos no nosso{" "}
                        <b>Simulador de Entrevista</b> e faça uma simulação de
                        entrevista interativa para consolidar seus
                        conhecimentos.
                      </p>
                      <button
                        onClick={() => setActiveTab("interview")}
                        className="mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                      >
                        Ir para Simulador <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ABA 5: SIMULADOR DE ENTREVISTA --- */}
        {activeTab === "interview" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-400" /> Simulador
                de Entrevista Técnica (Agent 4)
              </h2>
              <p className="text-slate-400 text-sm">
                Conduza uma simulação de conversa em tempo real com um
                recrutador virtual técnico de ponta. O agente formulará
                perguntas desafiadoras baseadas nos critérios de nossa base de
                conhecimento (RAG) e gerará uma nota final.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* SELEÇÃO DE CATEGORIAS E CONFIGS */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
                    Configurações da Sessão
                  </h3>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tema Técnico
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        "React",
                        "Node.js",
                        "AWS",
                        "PostgreSQL",
                        "System Design",
                        "Behavioral",
                      ].map((cat) => (
                        <button
                          key={cat}
                          onClick={() =>
                            !isInterviewStarted && setInterviewCategory(cat)
                          }
                          disabled={isInterviewStarted}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all truncate ${
                            interviewCategory === cat
                              ? "bg-indigo-600 border-indigo-500 text-white shadow"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nível de Dificuldade
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Junior", "Pleno", "Senior"].map((sen) => (
                        <button
                          key={sen}
                          onClick={() =>
                            !isInterviewStarted && setInterviewSeniority(sen)
                          }
                          disabled={isInterviewStarted}
                          className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold border transition-all ${
                            interviewSeniority === sen
                              ? "bg-indigo-600 border-indigo-500 text-white shadow"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                          }`}
                        >
                          {sen}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isInterviewStarted ? (
                    <button
                      onClick={handleStartInterview}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
                    >
                      Iniciar Entrevista <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleStopInterview}
                      className="w-full py-3 bg-red-950 hover:bg-red-900 text-red-300 font-bold border border-red-900/30 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Encerrar Sessão <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-4 leading-relaxed">
                    ⚙️ <b>Como Funciona:</b> O bot conduzirá uma conversa com 3
                    perguntas técnicas do tema e nível selecionados. Ao
                    responder, envie sua resposta em texto. Ao fim, um scorecard
                    completo com nota e feedbacks será liberado automaticamente.
                  </div>
                </div>
              </div>

              {/* SALA DE CHAT ATIVA */}
              <div className="lg:col-span-3 flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                {isInterviewStarted ? (
                  <div className="flex flex-col h-full">
                    {/* CABEÇALHO DO CHAT */}
                    <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-850 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-500/15 border border-emerald-500/30 w-2.5 h-2.5 rounded-full animate-pulse"></div>
                        <span className="text-xs font-extrabold text-white">
                          Sessão de Simulação Ativa
                        </span>
                      </div>
                      <span className="bg-slate-900 px-3 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-slate-800">
                        {interviewCategory} ({interviewSeniority})
                      </span>
                    </div>

                    {/* CORPO DE MENSAGENS */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin">
                      {messages.map(
                        (message: ChatUIMessage) => {
                          const content = message.content || (message.parts && Array.isArray(message.parts) ? message.parts.map((part: MessagePart) => part.text || "").join("") : "");
                          // Não renderizar mensagem oculta do sistema
                          if (
                            content ===
                            "Estou pronto para iniciar a simulação de entrevista técnica."
                          ) {
                            return null;
                          }

                          const isAssistant = message.role === "assistant";

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isAssistant ? "justify-start" : "justify-end"} animate-fadeIn`}
                            >
                              <div
                                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl flex flex-col gap-1 shadow ${
                                  isAssistant
                                    ? "bg-slate-950 text-slate-100 rounded-tl-none border border-slate-850"
                                    : "bg-indigo-600 text-white rounded-tr-none"
                                }`}
                              >
                                <span
                                  className={`text-[9px] uppercase font-black tracking-wider ${isAssistant ? "text-indigo-400" : "text-indigo-200"}`}
                                >
                                  {isAssistant
                                    ? "Recrutador IA"
                                    : "Você (Candidato)"}
                                </span>
                                <p className="text-xs md:text-sm leading-relaxed whitespace-pre-line">
                                  {content}
                                </p>
                              </div>
                            </div>
                          );
                        },
                      )}

                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-950 p-4 rounded-2xl rounded-tl-none border border-slate-850 text-slate-300 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              Digitando
                            </span>
                            <span className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                            </span>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* INPUT DE MENSAGEM */}
                    <form
                      onSubmit={handleSubmit}
                      className="p-4 bg-slate-950 border-t border-slate-850 flex gap-2"
                    >
                      <input
                        id="chat-input"
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Digite aqui sua resposta técnica de forma detalhada..."
                        disabled={isChatLoading}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isChatLoading || !input?.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 flex items-center justify-center shrink-0 cursor-pointer transition-all disabled:bg-slate-850 disabled:text-slate-600 shadow"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                    <div className="bg-slate-950 p-4 rounded-full border border-slate-800 text-slate-600">
                      <Terminal className="w-8 h-8" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="font-bold text-white text-base">
                        Preparado para Simular?
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Selecione as configurações desejadas (Categoria de
                        Tecnologia e Dificuldade) na barra lateral esquerda e
                        inicie sua simulação.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- SEÇÃO INFORMATIVA ABOUT --- */}
      <footer
        id="about"
        className="border-t border-slate-900 bg-slate-950 px-6 py-12 text-slate-500 text-xs"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="font-extrabold text-sm text-slate-400">
              AI Career Coach
            </h4>
            <p className="leading-relaxed">
              Uma ferramenta inteligente para desenvolvedores que querem decolar
              em processos seletivos. Mapeie gaps conceituais, execute um motor
              RAG sob arquivos markdown em tempo real e teste seu nível em
              simulados automatizados.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-extrabold text-sm text-slate-400">
              Stack de Tecnologias
            </h4>
            <p className="leading-relaxed">
              Construído com Next.js 15, React 19, TypeScript, TailwindCSS v4,
              Vercel AI SDK (GPT-4o), PostgreSQL, e pgvector integrado ao banco
              de dados Supabase para busca semântica em tempo de execução.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-extrabold text-sm text-slate-400">
              Armazenamento Seguro
            </h4>
            <p className="leading-relaxed">
              Todos os dados e relatórios de vagas e currículos são salvos de
              forma isolada na tabela do banco, garantindo que o seu histórico e
              conselhos fiquem salvos de forma resiliente.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 border-t border-slate-900 pt-6 text-center text-[10px]">
          © {new Date().getFullYear()} AI Career Coach. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  );
}
