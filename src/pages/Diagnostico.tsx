import { useState } from "react";
import { validateEmail } from "@/lib/email-validation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CheckCircle2, Sparkles, Target, Users, Bot, Settings2, Handshake, FolderKanban, ShoppingCart } from "lucide-react";
import orbitLogo from "@/assets/orbit-icon.png";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";

interface QuestionLevel {
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
}

type QuestionTheme = "estrategia" | "processos" | "pessoas" | "comercial" | "projetos" | "compras" | "ia";

interface Question {
  id: number;
  category: "gestao" | "ia";
  theme?: QuestionTheme;
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

type Step = "email" | "loading" | "quiz" | "submitting" | "result";

const MATURITY_COLORS: Record<string, string> = {
  "Iniciante": "bg-red-500",
  "Básico": "bg-orange-500",
  "Intermediário": "bg-yellow-500",
  "Avançado": "bg-green-500",
  "Referência": "bg-blue-500",
};

const THEME_INFO: Record<QuestionTheme, { icon: React.ReactNode; label: string }> = {
  estrategia: { icon: <Target className="h-4 w-4" />, label: "Direção & Estratégia" },
  processos: { icon: <Settings2 className="h-4 w-4" />, label: "Processos & Execução" },
  pessoas: { icon: <Users className="h-4 w-4" />, label: "Pessoas & Estrutura" },
  comercial: { icon: <Handshake className="h-4 w-4" />, label: "Comercial & Rotina" },
  projetos: { icon: <FolderKanban className="h-4 w-4" />, label: "Projetos & Entregas" },
  compras: { icon: <ShoppingCart className="h-4 w-4" />, label: "Compras & Suprimentos" },
  ia: { icon: <Bot className="h-4 w-4" />, label: "Maturidade em IA" },
};

function getCategoryInfo(question: Question | undefined, qNum: number) {
  if (question?.theme && THEME_INFO[question.theme]) return THEME_INFO[question.theme];
  if (qNum <= 3) return THEME_INFO.estrategia;
  if (qNum <= 6) return THEME_INFO.processos;
  if (qNum <= 8) return THEME_INFO.pessoas;
  if (qNum <= 10) return THEME_INFO.comercial;
  return THEME_INFO.ia;
}

export default function Diagnostico() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [celularInput, setCelularInput] = useState("");
  const [celularFull, setCelularFull] = useState("+55");
  const [empresaInput, setEmpresaInput] = useState("");
  const [error, setError] = useState("");
  const [diagnosticId, setDiagnosticId] = useState("");
  const [leadNome, setLeadNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [setorInput, setSetorInput] = useState("");

  const handleStartDiagnostic = async () => {
    if (!email.trim()) { setError("Informe seu email"); return; }
    const emailCheck = validateEmail(email.trim());
    if (!emailCheck.valid) { setError(emailCheck.error || "E-mail inválido"); return; }
    if (!nomeInput.trim()) { setError("Informe seu nome"); return; }
    if (!celularInput.trim()) { setError("Informe seu celular"); return; }
    if (!empresaInput.trim()) { setError("Informe o nome da empresa"); return; }
    if (!setorInput.trim()) { setError("Informe o setor da sua empresa"); return; }
    setError("");
    setStep("loading");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-diagnostic", {
        body: {
          email: email.trim().toLowerCase(),
          setor_manual: setorInput.trim(),
          nome_manual: nomeInput.trim(),
          celular_manual: celularFull,
          empresa_manual: empresaInput.trim(),
        },
      });

      if (fnError) throw fnError;
      if (data?.error) { setError(data.error); setStep("email"); return; }

      setDiagnosticId(data.diagnostic_id);
      setLeadNome(data.lead_nome);
      setEmpresa(data.empresa);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(0));
      setCurrentQ(0);
      setStep("quiz");
    } catch (e: unknown) {
      console.error(e);
      setError("Erro ao gerar diagnóstico. Tente novamente.");
      setStep("email");
    }
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 350);
    }
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === 0)) return;
    setStep("submitting");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-diagnostic", {
        body: { diagnostic_id: diagnosticId, answers },
      });

      if (fnError) throw fnError;
      if (data?.error) { setError(data.error); setStep("quiz"); return; }

      setResult(data);
      setStep("result");
    } catch (e: unknown) {
      console.error(e);
      setError("Erro ao enviar respostas. Tente novamente.");
      setStep("quiz");
    }
  };

  const isLastQuestion = currentQ === questions.length - 1;
  const allAnswered = answers.every(a => a > 0);
  const progressValue = questions.length > 0 ? ((answers.filter(a => a > 0).length) / questions.length) * 100 : 0;

  const q = questions[currentQ];
  const qNum = q?.id || (currentQ + 1);
  const { icon: categoryIcon, label: categoryLabel } = getCategoryInfo(q, qNum);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-center gap-3">
        <img src={orbitLogo} alt="Orbit" className="h-7" />
        <span className="text-sm font-semibold text-muted-foreground">Diagnóstico de Maturidade</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {step === "email" && (
          <Card className="w-full max-w-md p-8 space-y-6 text-center">
            <div className="space-y-2">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                Diagnóstico de Maturidade
              </h1>
              <p className="text-muted-foreground text-sm">
                Descubra o nível de maturidade da sua empresa em <strong>Gestão</strong> e <strong>Inteligência Artificial</strong> com 13 perguntas personalizadas para o seu contexto de negócio.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Seu nome"
                value={nomeInput}
                onChange={e => setNomeInput(e.target.value)}
                className="text-center"
              />
              <Input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="text-center"
              />
              <PhoneInputWithCountry
                onValueChange={(full, raw) => {
                  setCelularFull(full);
                  setCelularInput(raw);
                }}
              />
              <Input
                type="text"
                placeholder="Nome da empresa"
                value={empresaInput}
                onChange={e => setEmpresaInput(e.target.value)}
                className="text-center"
              />
              <Input
                type="text"
                placeholder="Setor da empresa (ex: Contabilidade, Marketing, Saúde...)"
                value={setorInput}
                onChange={e => setSetorInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleStartDiagnostic()}
                className="text-center"
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button onClick={handleStartDiagnostic} className="w-full gap-2" size="lg">
                Iniciar Diagnóstico <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Leva menos de 5 minutos · Resultado instantâneo
            </p>
          </Card>
        )}

        {step === "loading" && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-foreground font-semibold">Gerando suas perguntas personalizadas...</p>
              <p className="text-muted-foreground text-sm">Nossa IA está analisando seu setor e contexto de gestão</p>
            </div>
          </div>
        )}

        {step === "quiz" && q && (
          <div className="w-full max-w-lg space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{leadNome} • {empresa}</span>
                <span>{currentQ + 1}/{questions.length}</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            <Badge variant="secondary" className="gap-1.5">
              {categoryIcon} {categoryLabel}
            </Badge>

            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {q.question}
            </h2>

            <div className="space-y-2">
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleAnswer(level)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    answers[currentQ] === level
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      answers[currentQ] === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {level}
                    </span>
                    <span className="text-sm leading-snug pt-0.5">
                      {q.levels[String(level) as keyof QuestionLevel]}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {isLastQuestion && allAnswered && (
              <div className="flex justify-end">
                <Button onClick={handleSubmit} className="gap-1">
                  Finalizar <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "submitting" && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-foreground font-semibold">Processando seu diagnóstico...</p>
              <p className="text-muted-foreground text-sm">Calculando scores e gerando insights</p>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Diagnóstico Concluído!</h1>
              <p className="text-muted-foreground text-sm">{leadNome} • {empresa}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ScoreCard label="Gestão" score={result.score_gestao} icon={<Target className="h-5 w-5" />} />
              <ScoreCard label="IA" score={result.score_ia} icon={<Bot className="h-5 w-5" />} />
              <ScoreCard label="Total" score={result.score_total} icon={<Sparkles className="h-5 w-5" />} />
            </div>

            <div className="text-center">
              <Badge className={`${MATURITY_COLORS[result.maturity_level] || "bg-muted"} text-white text-lg px-6 py-2`}>
                {result.maturity_level}
              </Badge>
            </div>

            {result.ai_summary && (
              <Card className="p-4 border-l-4 border-l-primary">
                <p className="text-sm text-foreground leading-relaxed">{result.ai_summary}</p>
              </Card>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Enviamos o resultado completo para seu email 📧
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreCard({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const pct = (score / 5) * 100;
  return (
    <Card className="p-4 text-center space-y-2">
      <div className="text-primary mx-auto">{icon}</div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground">{score.toFixed(1)}</p>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}