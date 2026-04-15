import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Users, ChevronDown, ChevronUp, Bot, Target, Trash2, ExternalLink, FileText, Loader2, Flame, Thermometer, Snowflake } from "lucide-react";
import { toast } from "sonner";
import DiagnosticoInsights from "./DiagnosticoInsights";

interface MeetingSummary {
  resumo: string;
  proximos_passos_lead: string[];
  acoes_vendedor: string[];
  temperatura: "quente" | "morno" | "frio";
  observacoes: string;
}

interface DiagnosticResponse {
  id: string;
  lead_id: string | null;
  lead_nome: string;
  lead_email: string;
  lead_celular: string | null;
  lead_empresa: string | null;
  setor: string;
  sala_id: string | null;
  sala_nome: string | null;
  questions: Array<{ id: number; category: string; question: string; theme?: string }>;
  answers: number[] | null;
  score_gestao: number | null;
  score_ia: number | null;
  score_total: number | null;
  maturity_level: string | null;
  ai_summary: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_transcription: string | null;
  meeting_summary: MeetingSummary | null;
  created_at: string;
}

const MATURITY_COLORS: Record<string, string> = {
  "Iniciante": "bg-red-500",
  "Básico": "bg-orange-500",
  "Intermediário": "bg-yellow-500",
  "Avançado": "bg-green-500",
  "Referência": "bg-blue-500",
};

const TEMP_CONFIG = {
  quente: { icon: Flame, label: "Quente", className: "text-red-500" },
  morno: { icon: Thermometer, label: "Morno", className: "text-yellow-500" },
  frio: { icon: Snowflake, label: "Frio", className: "text-blue-500" },
};

const THEME_LABELS: Record<string, string> = {
  estrategia: "Estratégia",
  processos: "Processos",
  pessoas: "Pessoas",
  comercial: "Comercial",
  projetos: "Projetos",
  compras: "Compras",
  ia: "IA",
};

export default function DiagnosticoTab({ readOnly = false }: { readOnly?: boolean } = {}) {
  const [responses, setResponses] = useState<DiagnosticResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedScope, setSelectedScope] = useState<"geral" | "turma">("geral");
  const [selectedSala, setSelectedSala] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pipedriveMap, setPipedriveMap] = useState<Record<string, number>>({});
  const [transcriptionInput, setTranscriptionInput] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});
  const [loadingOwners, setLoadingOwners] = useState(false);

  useEffect(() => {
    fetchResponses();
    const channel = supabase
      .channel("diagnostic-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "diagnostic_responses" }, () => {
        fetchResponses();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResponses = async () => {
    const [{ data: diagData }, { data: leadsData }] = await Promise.all([
      supabase
        .from("diagnostic_responses")
        .select("*")
        .not("answers", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("id, email, pipedrive_deal_id")
    ]);

    const diagResponses = (diagData as unknown as DiagnosticResponse[]) || [];
    setResponses(diagResponses);

    const map: Record<string, number> = {};
    if (leadsData) {
      for (const lead of leadsData) {
        if (lead.pipedrive_deal_id) {
          map[`id:${lead.id}`] = lead.pipedrive_deal_id;
          if (lead.email) map[`email:${lead.email.toLowerCase()}`] = lead.pipedrive_deal_id;
        }
      }
    }
    setPipedriveMap(map);
    setLoading(false);

    if (diagResponses.length > 0) {
      fetchOwners(diagResponses, leadsData || []);
    }
  };

  const fetchOwners = async (diags: DiagnosticResponse[], leadsData: any[]) => {
    setLoadingOwners(true);
    try {
      const leadsById = new Map(leadsData.map((l: any) => [l.id, l]));
      const leadsByEmail = new Map(leadsData.map((l: any) => [l.email?.toLowerCase(), l]));

      const leadsPayload = diags.map(r => {
        const matchedLead = (r.lead_id && leadsById.get(r.lead_id)) || leadsByEmail.get(r.lead_email?.toLowerCase());
        return {
          id: r.id,
          email: r.lead_email,
          nome: r.lead_nome,
          pipedrive_deal_id: matchedLead?.pipedrive_deal_id || null,
        };
      });

      const { data, error } = await supabase.functions.invoke("get-pipedrive-owners", {
        body: { leads: leadsPayload },
      });

      if (!error && data?.results) {
        const newMap: Record<string, string> = {};
        for (const [id, info] of Object.entries(data.results)) {
          newMap[id] = (info as any).owner_name;
        }
        setOwnerMap(newMap);
      }
    } catch (e) {
      console.error("Error fetching owners:", e);
    } finally {
      setLoadingOwners(false);
    }
  };

  const getPipedriveDealId = (r: DiagnosticResponse): number | null => {
    if (r.lead_id && pipedriveMap[`id:${r.lead_id}`]) return pipedriveMap[`id:${r.lead_id}`];
    if (r.lead_email && pipedriveMap[`email:${r.lead_email.toLowerCase()}`]) return pipedriveMap[`email:${r.lead_email.toLowerCase()}`];
    return null;
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o diagnóstico de "${nome}"?`)) return;
    const { error } = await supabase.from("diagnostic_responses").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir diagnóstico");
    } else {
      toast.success("Diagnóstico excluído");
      setResponses(prev => prev.filter(r => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleSummarize = useCallback(async (r: DiagnosticResponse) => {
    const text = transcriptionInput[r.id]?.trim() || r.meeting_transcription?.trim();
    if (!text || text.length < 50) {
      toast.error("Cole uma transcrição com pelo menos 50 caracteres.");
      return;
    }

    setProcessingId(r.id);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-transcription", {
        body: { transcription: text, lead_nome: r.lead_nome, setor: r.setor },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const summary = data.summary as MeetingSummary;

      await supabase
        .from("diagnostic_responses")
        .update({
          meeting_transcription: text,
          meeting_summary: summary as any,
        })
        .eq("id", r.id);

      setResponses(prev => prev.map(item =>
        item.id === r.id ? { ...item, meeting_transcription: text, meeting_summary: summary } : item
      ));
      setTranscriptionInput(prev => { const n = { ...prev }; delete n[r.id]; return n; });
      toast.success("Resumo gerado com sucesso!");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar resumo. Tente novamente.");
    } finally {
      setProcessingId(null);
    }
  }, [transcriptionInput]);

  const toLocalDateKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  const responseDates = useMemo(() => {
    const dates = new Set<string>();
    responses.forEach(r => { if (r.created_at) dates.add(toLocalDateKey(r.created_at)); });
    return Array.from(dates).sort().reverse();
  }, [responses]);

  const salaOptions = useMemo(() => {
    const uniqueSalas = new Map<string, string>();
    responses.forEach(r => {
      if (r.sala_id && r.sala_nome && !uniqueSalas.has(r.sala_id)) {
        uniqueSalas.set(r.sala_id, r.sala_nome);
      }
    });

    return Array.from(uniqueSalas.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [responses]);

  const selectedSalaName = useMemo(
    () => salaOptions.find(sala => sala.id === selectedSala)?.nome ?? null,
    [salaOptions, selectedSala]
  );

  const filtered = useMemo(() => {
    return responses.filter(r => {
      const matchesDate = selectedDate === "all" || toLocalDateKey(r.created_at) === selectedDate;
      const matchesScope = selectedScope === "geral"
        ? true
        : selectedSala === "all"
          ? Boolean(r.sala_id)
          : r.sala_id === selectedSala;

      return matchesDate && matchesScope;
    });
  }, [responses, selectedDate, selectedScope, selectedSala]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return { total: 0, avgGestao: 0, avgIa: 0, avgTotal: 0 };
    const avgGestao = filtered.reduce((a, r) => a + (r.score_gestao || 0), 0) / filtered.length;
    const avgIa = filtered.reduce((a, r) => a + (r.score_ia || 0), 0) / filtered.length;
    const avgTotal = filtered.reduce((a, r) => a + (r.score_total || 0), 0) / filtered.length;
    return { total: filtered.length, avgGestao, avgIa, avgTotal };
  }, [filtered]);

  const scopeLabel = useMemo(() => {
    if (selectedScope === "geral") return "Visão geral";
    if (selectedSala === "all") return "Todas as turmas com vínculo";
    return selectedSalaName ? `Turma: ${selectedSalaName}` : "Turma";
  }, [selectedScope, selectedSala, selectedSalaName]);

  const reportScopeHint = useMemo(() => {
    if (selectedScope === "geral") {
      return "Escolha o recorte antes de gerar o relatório. Você pode analisar o acumulado geral ou mudar para uma turma específica a qualquer momento.";
    }

    if (selectedSalaName) {
      return `Recorte independente configurado para a turma ${selectedSalaName}. Você pode gerar esse relatório sem passar pela visão geral.`;
    }

    return "Modo por turma ativo. Selecione uma turma específica ou mantenha o agrupamento de todas as turmas vinculadas para gerar o relatório desse recorte.";
  }, [selectedScope, selectedSalaName]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Configurar relatório</p>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Escolha o recorte antes de gerar os insights. Você pode analisar a visão geral ou ir direto para uma turma específica.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{scopeLabel}</Badge>
              <Badge variant="secondary">{filtered.length} respostas no recorte</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Select value={selectedScope} onValueChange={(value: "geral" | "turma") => setSelectedScope(value)}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Filtrar escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Visão geral</SelectItem>
                <SelectItem value="turma">Por turma</SelectItem>
              </SelectContent>
            </Select>

            {selectedScope === "turma" && (
              <Select value={selectedSala} onValueChange={setSelectedSala}>
                <SelectTrigger className="w-full lg:w-[260px]">
                  <SelectValue placeholder="Selecionar turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas com vínculo</SelectItem>
                  {salaOptions.map(sala => (
                    <SelectItem key={sala.id} value={sala.id}>{sala.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Filtrar por data de resposta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                {responseDates.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">{reportScopeHint}</p>
        </CardContent>
      </Card>

      {!readOnly && (
        <DiagnosticoInsights
          responses={filtered}
          scopeLabel={scopeLabel}
          scopeMode={selectedScope}
          selectedSalaName={selectedSalaName}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground uppercase">Respondidos</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground uppercase">Média Gestão</p>
          <p className="text-2xl font-bold text-foreground">{stats.avgGestao.toFixed(1)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Bot className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground uppercase">Média IA</p>
          <p className="text-2xl font-bold text-foreground">{stats.avgIa.toFixed(1)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground uppercase">Média Total</p>
          <p className="text-2xl font-bold text-foreground">{stats.avgTotal.toFixed(1)}</p>
        </CardContent></Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma resposta encontrada para este recorte.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const dealId = getPipedriveDealId(r);
            const summary = r.meeting_summary as MeetingSummary | null;
            const TempIcon = summary?.temperatura ? TEMP_CONFIG[summary.temperatura]?.icon : null;

            return (
              <Card key={r.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{r.lead_nome}</p>
                        {summary && TempIcon && (
                          <TempIcon className={`h-4 w-4 flex-shrink-0 ${TEMP_CONFIG[summary.temperatura]?.className}`} />
                        )}
                        {summary && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            <FileText className="h-3 w-3 mr-1" /> Resumido
                          </Badge>
                        )}
                        {ownerMap[r.id] && (
                          <Badge variant="secondary" className="text-xs">
                            {ownerMap[r.id]}
                          </Badge>
                        )}
                        {r.sala_nome && (
                          <Badge variant="outline" className="text-xs">
                            {r.sala_nome}
                          </Badge>
                        )}
                        {loadingOwners && !ownerMap[r.id] && <span className="text-xs text-muted-foreground/50">carregando...</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span>{r.setor}</span>
                        {r.lead_empresa && <><span>•</span><span className="font-medium text-foreground/80">{r.lead_empresa}</span></>}
                        <span>•</span>
                        <span>{r.lead_email}</span>
                        {r.lead_celular && (
                          <>
                            <span>•</span>
                            <a href={`https://wa.me/${r.lead_celular.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{r.lead_celular}</a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                      <MiniScore icon={<Target className="h-3 w-3" />} label="Gestão" value={r.score_gestao} />
                      <MiniScore icon={<Bot className="h-3 w-3" />} label="IA" value={r.score_ia} />
                      <MiniScore icon={<Sparkles className="h-3 w-3" />} label="Total" value={r.score_total} />
                    </div>

                    {r.maturity_level && (
                      <Badge className={`${MATURITY_COLORS[r.maturity_level] || "bg-muted"} text-white`}>
                        {r.maturity_level}
                      </Badge>
                    )}

                    {expandedId === r.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  <div className="flex md:hidden items-center gap-3 mt-3">
                    <MiniScore icon={<Target className="h-3 w-3" />} label="Gestão" value={r.score_gestao} />
                    <MiniScore icon={<Bot className="h-3 w-3" />} label="IA" value={r.score_ia} />
                    <MiniScore icon={<Sparkles className="h-3 w-3" />} label="Total" value={r.score_total} />
                  </div>
                </div>

                {expandedId === r.id && (
                  <div className="border-t border-border p-4 space-y-4 bg-muted/10">
                    {summary && <MeetingSummaryCard summary={summary} />}

                    {!readOnly && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {summary ? "Atualizar transcrição" : "Transcrição da reunião"}
                        </p>
                        <Textarea
                          placeholder="Cole aqui a transcrição da reunião..."
                          className="min-h-[100px] text-sm"
                          value={transcriptionInput[r.id] ?? r.meeting_transcription ?? ""}
                          onChange={(e) => setTranscriptionInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleSummarize(r); }}
                          disabled={processingId === r.id}
                        >
                          {processingId === r.id ? (
                            <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Analisando...</>
                          ) : (
                            <><Sparkles className="h-3.5 w-3.5 mr-1" /> {summary ? "Regerar resumo" : "Gerar resumo com IA"}</>
                          )}
                        </Button>
                      </div>
                    )}

                    {r.ai_summary && (
                      <div className="p-3 bg-card rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Resumo diagnóstico IA</p>
                        <p className="text-sm text-foreground leading-relaxed">{r.ai_summary}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase">Perguntas & Respostas</p>
                      {r.questions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                          <Badge variant="outline" className="flex-shrink-0 text-xs">
                            {THEME_LABELS[q.theme || ""] || (q.category === "gestao" ? "Gestão" : "IA")}
                          </Badge>
                          <p className="text-sm text-foreground flex-1">{q.question}</p>
                          <span className="text-sm font-bold text-primary flex-shrink-0">
                            {r.answers?.[i]}/5
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {r.sala_nome ? `${r.sala_nome} · ` : ""}
                        Reunião: {r.meeting_date || "—"} às {r.meeting_time || "—"} · Respondido: {new Date(r.created_at).toLocaleString("pt-BR")}
                      </p>
                      <div className="flex items-center gap-2">
                        {dealId && (
                          <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                            <a href={`https://orbitgestao.pipedrive.com/deal/${dealId}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Pipedrive
                            </a>
                          </Button>
                        )}
                        {!readOnly && (
                          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.lead_nome); }}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MeetingSummaryCard({ summary }: { summary: MeetingSummary }) {
  const temp = TEMP_CONFIG[summary.temperatura];
  const TempIcon = temp?.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-primary" /> Resumo da Reunião
        </p>
        {TempIcon && (
          <Badge variant="outline" className={`gap-1 ${temp.className}`}>
            <TempIcon className="h-3.5 w-3.5" /> {temp.label}
          </Badge>
        )}
      </div>

      <p className="text-sm text-foreground leading-relaxed">{summary.resumo}</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">📋 Próximos passos do lead</p>
          <ul className="space-y-1">
            {summary.proximos_passos_lead.map((item, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">🎯 Ações do vendedor</p>
          <ul className="space-y-1">
            {summary.acoes_vendedor.map((item, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {summary.observacoes && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground"><strong>Observações:</strong> {summary.observacoes}</p>
        </div>
      )}
    </div>
  );
}

function MiniScore({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-primary">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value?.toFixed(1) ?? "—"}</span>
    </div>
  );
}