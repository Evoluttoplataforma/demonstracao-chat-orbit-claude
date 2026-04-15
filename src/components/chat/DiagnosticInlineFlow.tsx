import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Sparkles, Target, Bot, ArrowRight, Briefcase, TrendingUp, Users } from "lucide-react";
import ChatInput from "./ChatInput";
import { CONSULTOR_DIAGNOSTIC_QUESTIONS } from "./consultorDiagnosticQuestions";

interface QuestionLevel {
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
}

interface Question {
  id: number;
  category: "gestao" | "ia";
  theme?: string;
  question: string;
  levels: QuestionLevel;
}

interface DiagnosticResult {
  score_gestao: number;
  score_ia: number;
  score_total: number;
  maturity_level: string;
  ai_summary: string;
}

const MATURITY_COLORS: Record<string, string> = {
  "Iniciante": "bg-red-500",
  "Básico": "bg-orange-500",
  "Intermediário": "bg-yellow-500",
  "Avançado": "bg-green-500",
  "Referência": "bg-blue-500",
};

const CONSULTOR_MATURITY_COLORS: Record<string, string> = {
  "Consultor Iniciante": "bg-red-500",
  "Consultor em Estruturação": "bg-orange-500",
  "Consultor Consolidado": "bg-yellow-500",
  "Canal Avançado": "bg-green-500",
  "Canal Referência": "bg-blue-500",
};

function isConsultorProfile(setor: string): boolean {
  const lower = setor.toLowerCase();
  return lower.includes("consultoria") || lower.includes("consultor");
}

type InternalStep = "setor" | "loading" | "quiz" | "submitting" | "result";

interface DiagnosticInlineFlowProps {
  leadNome: string;
  leadEmail: string;
  leadCelular: string;
  leadEmpresa: string;
  leadId?: string;
  prefilledSetor?: string;
  onComplete: () => void;
}

export default function DiagnosticInlineFlow({
  leadNome,
  leadEmail,
  leadCelular,
  leadEmpresa,
  leadId,
  prefilledSetor,
  onComplete,
}: DiagnosticInlineFlowProps) {
  const [internalStep, setInternalStep] = useState<InternalStep>(prefilledSetor ? "loading" : "setor");
  const [setor, setSetor] = useState(prefilledSetor || "");
  const [isConsultor, setIsConsultor] = useState(false);
  const [diagnosticId, setDiagnosticId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  }, [currentQ, answers]);

  const startDiagnostic = async (setorValue: string) => {
    setSetor(setorValue);
    setInternalStep("loading");
    setError("");

    const consultorDetected = isConsultorProfile(setorValue);
    setIsConsultor(consultorDetected);

    if (consultorDetected) {
      // Use fixed consultant questions — create record directly
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from("diagnostic_responses")
          .insert({
            lead_email: leadEmail.toLowerCase(),
            lead_nome: leadNome,
            lead_celular: leadCelular || null,
            lead_empresa: leadEmpresa || null,
            lead_id: leadId || null,
            setor: "Consultoria",
            questions: CONSULTOR_DIAGNOSTIC_QUESTIONS as any,
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;

        setDiagnosticId(inserted.id);
        setQuestions(CONSULTOR_DIAGNOSTIC_QUESTIONS as any);
        setAnswers(new Array(CONSULTOR_DIAGNOSTIC_QUESTIONS.length).fill(0));
        setCurrentQ(0);
        setInternalStep("quiz");
      } catch (e) {
        console.error(e);
        setError("Erro ao iniciar diagnóstico. Tente novamente.");
        setInternalStep("setor");
      }
      return;
    }

    // Standard flow: AI-generated questions
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-diagnostic", {
        body: {
          email: leadEmail.toLowerCase(),
          setor_manual: setorValue,
          nome_manual: leadNome,
          celular_manual: leadCelular,
          empresa_manual: leadEmpresa,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        setInternalStep("setor");
        return;
      }

      setDiagnosticId(data.diagnostic_id);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(0));
      setCurrentQ(0);
      setInternalStep("quiz");
    } catch (e) {
      console.error(e);
      setError("Erro ao gerar diagnóstico. Tente novamente.");
      setInternalStep("setor");
    }
  };

  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (prefilledSetor && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startDiagnostic(prefilledSetor);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 350);
    }
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === 0)) return;
    setInternalStep("submitting");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-diagnostic", {
        body: { diagnostic_id: diagnosticId, answers, source: "chat" },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        setInternalStep("quiz");
        return;
      }

      setResult(data);
      setInternalStep("result");
    } catch (e) {
      console.error(e);
      setError("Erro ao enviar respostas. Tente novamente.");
      setInternalStep("quiz");
    }
  };

  const q = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;
  const allAnswered = answers.every((a) => a > 0);
  const progressValue = questions.length > 0 ? (answers.filter((a) => a > 0).length / questions.length) * 100 : 0;

  if (internalStep === "setor") {
    return (
      <div className="space-y-3 animate-fade-in-up">
        <p className="text-sm text-gray-600">
          Para personalizar suas perguntas, qual o setor da sua empresa?
        </p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <ChatInput
          label="SETOR"
          placeholder="Ex: Contabilidade, Marketing, Saúde..."
          onSubmit={(v) => startDiagnostic(v)}
        />
      </div>
    );
  }

  if (internalStep === "loading") {
    return (
      <div className="text-center space-y-4 py-8 animate-fade-in-up">
        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="text-gray-900 font-semibold text-sm">
            {isConsultor ? "Preparando seu diagnóstico de canal..." : "Gerando perguntas personalizadas..."}
          </p>
          <p className="text-gray-500 text-xs">
            {isConsultor ? "Avaliando seu potencial como parceiro Orbit" : `Analisando o setor e contexto da ${leadEmpresa}`}
          </p>
        </div>
      </div>
    );
  }

  if (internalStep === "quiz" && q) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{leadNome} • {leadEmpresa}</span>
            <span>{currentQ + 1}/{questions.length}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <h2 className="text-sm font-semibold text-gray-900 leading-tight">{q.question}</h2>

        <div className="space-y-2">
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleAnswer(level)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                answers[currentQ] === level
                  ? "border-primary bg-primary/10 text-gray-900 ring-1 ring-primary font-medium"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  answers[currentQ] === level
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {level}
                </span>
                <span className="leading-snug pt-0.5">
                  {q.levels[String(level) as keyof QuestionLevel]}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Anterior
            </button>
          )}
          <div className="flex-1" />
          {isLastQuestion && allAnswered && (
            <Button onClick={handleSubmit} size="sm" className="gap-1">
              Finalizar <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  if (internalStep === "submitting") {
    return (
      <div className="text-center space-y-4 py-8 animate-fade-in-up">
        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
        <p className="text-gray-900 font-semibold text-sm">
          {isConsultor ? "Analisando seu perfil de canal..." : "Calculando seu diagnóstico..."}
        </p>
      </div>
    );
  }

  if (internalStep === "result" && result) {
    const maturityColors = isConsultor ? CONSULTOR_MATURITY_COLORS : MATURITY_COLORS;

    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">
            {isConsultor ? "Diagnóstico de Canal Concluído!" : "Diagnóstico Concluído!"}
          </h2>
        </div>

        {isConsultor ? (
          <div className="grid grid-cols-3 gap-2">
            <ScoreCard label="Negócio" score={result.score_gestao} icon={<Briefcase className="h-4 w-4" />} />
            <ScoreCard label="Escala" score={result.score_ia} icon={<TrendingUp className="h-4 w-4" />} />
            <ScoreCard label="Total" score={result.score_total} icon={<Sparkles className="h-4 w-4" />} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <ScoreCard label="Gestão" score={result.score_gestao} icon={<Target className="h-4 w-4" />} />
            <ScoreCard label="IA" score={result.score_ia} icon={<Bot className="h-4 w-4" />} />
            <ScoreCard label="Total" score={result.score_total} icon={<Sparkles className="h-4 w-4" />} />
          </div>
        )}

        <div className="text-center">
          <Badge className={`${maturityColors[result.maturity_level] || "bg-muted"} text-white text-sm px-4 py-1.5`}>
            {result.maturity_level}
          </Badge>
        </div>

        {result.ai_summary && (
          <Card className="p-4 border-l-4 border-l-primary space-y-3 bg-white">
            {result.ai_summary.split(/\n\n+/).map((paragraph, idx) => {
              const isBoldLine = paragraph.trim().startsWith("**") && paragraph.trim().endsWith("**");
              if (isBoldLine) {
                return (
                  <h3 key={idx} className="text-sm font-bold text-primary pt-1">
                    {paragraph.replace(/\*\*/g, "")}
                  </h3>
                );
              }
              const lines = paragraph.split("\n");
              return (
                <div key={idx} className="space-y-1">
                  {lines.map((line, li) => {
                    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                    const escapeHtml = (s: string) =>
                      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
                    const formatted = escapeHtml(line)
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    if (isBullet) {
                      return (
                        <p key={li} className="text-xs text-gray-500 leading-relaxed pl-2" dangerouslySetInnerHTML={{ __html: formatted }} />
                      );
                    }
                    return (
                      <p key={li} className="text-xs text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
                    );
                  })}
                </div>
              );
            })}
          </Card>
        )}

        <div className="pt-2">
          <Button onClick={onComplete} className="w-full gap-2" size="lg">
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function ScoreCard({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const pct = (score / 5) * 100;
  return (
    <Card className="p-3 text-center space-y-1.5 bg-white">
      <div className="text-primary mx-auto">{icon}</div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900">{score.toFixed(1)}</p>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}
