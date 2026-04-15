import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertTriangle, TrendingUp, Target, Lightbulb, Users, BarChart3, RefreshCw, Layers3 } from "lucide-react";
import { toast } from "sonner";

interface PainPoint {
  dor: string;
  descricao: string;
  percentual_afetados: string;
  conexao_orbit: string;
}

interface Opportunity {
  oportunidade: string;
  descricao: string;
  argumento_venda: string;
}

interface SectorInsight {
  setor: string;
  insight: string;
  abordagem_sugerida: string;
}

interface ModuleRecommendation {
  modulo: string;
  porque: string;
  dores_relacionadas: string[];
  o_que_mostrar: string;
}

interface InsightsData {
  titulo: string;
  escopo_analise?: string;
  resumo_executivo: string;
  modulo_obrigatorio?: {
    modulo: string;
    porque: string;
  };
  modulos_sugeridos?: ModuleRecommendation[];
  principais_dores: PainPoint[];
  oportunidades_orbit: Opportunity[];
  perfil_predominante: {
    nivel: string;
    caracteristicas: string;
    gaps_principais: string[];
  };
  insights_por_setor: SectorInsight[];
  recomendacoes_estrategicas: string[];
}

interface DiagnosticForInsights {
  lead_nome: string;
  lead_empresa: string | null;
  setor: string;
  score_gestao: number | null;
  score_ia: number | null;
  score_total: number | null;
  maturity_level: string | null;
  ai_summary: string | null;
  sala_nome?: string | null;
  questions: Array<{ id: number; category: string; question: string; theme?: string }>;
  answers: number[] | null;
}

export default function DiagnosticoInsights({
  responses,
  scopeLabel,
  scopeMode = "geral",
  selectedSalaName = null,
}: {
  responses: DiagnosticForInsights[];
  scopeLabel: string;
  scopeMode?: "geral" | "turma";
  selectedSalaName?: string | null;
}) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInsights(null);
  }, [responses, scopeLabel]);

  const reportTitle = scopeMode === "turma" ? "Relatório por turma" : "Relatório geral";
  const reportDescription = scopeMode === "turma"
    ? selectedSalaName
      ? `Gere uma leitura comercial dedicada para a turma ${selectedSalaName}, sem depender do relatório geral.`
      : "Gere uma leitura comercial do recorte por turma selecionado, sem depender da visão geral."
    : "Gere uma leitura comercial do recorte atual com módulo obrigatório, Top 3 sugeridos e justificativas para a apresentação.";
  const reportActionLabel = scopeMode === "turma"
    ? selectedSalaName
      ? `Gerar relatório da turma ${selectedSalaName}`
      : "Gerar relatório por turma"
    : `Gerar relatório geral`;

  const generateInsights = async () => {
    if (responses.length < 3) {
      toast.error("Necessário pelo menos 3 respostas para gerar insights.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-diagnostic-insights", {
        body: { responses, scope_label: scopeLabel },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setInsights(data.insights);
      toast.success("Relatório gerado com sucesso!");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar insights. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-8 text-center space-y-4">
          <Sparkles className="h-12 w-12 text-primary mx-auto opacity-60" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{reportTitle}</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">{reportDescription}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="outline">{scopeLabel}</Badge>
              <Badge variant="secondary">{responses.length} respostas no recorte</Badge>
            </div>
          </div>
          <Button onClick={generateInsights} disabled={loading || responses.length < 3} className="gap-2 max-w-full whitespace-normal h-auto py-3" size="lg">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analisando {responses.length} respostas...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {reportActionLabel}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {responses.length < 3
              ? "Mínimo de 3 respostas necessárias neste recorte."
              : scopeMode === "turma"
                ? "Você pode gerar esse relatório por turma sem precisar passar pela visão geral."
                : "Se quiser, troque o recorte acima para gerar direto por turma."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-foreground">{insights.titulo}</h3>
          <p className="text-sm text-muted-foreground">Baseado em {responses.length} diagnósticos</p>
          <Badge variant="outline" className="mt-2">{insights.escopo_analise || scopeLabel}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={generateInsights} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Regerar
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <p className="text-sm text-foreground leading-relaxed">{insights.resumo_executivo}</p>
        </CardContent>
      </Card>

      {(insights.modulo_obrigatorio || insights.modulos_sugeridos?.length) && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground uppercase flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" /> Recomendação para a Apresentação
          </h4>

          {insights.modulo_obrigatorio && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>Obrigatório</Badge>
                  <p className="font-semibold text-foreground">{insights.modulo_obrigatorio.modulo}</p>
                </div>
                <p className="text-sm text-muted-foreground">{insights.modulo_obrigatorio.porque}</p>
              </CardContent>
            </Card>
          )}

          {!!insights.modulos_sugeridos?.length && (
            <div className="grid md:grid-cols-3 gap-3">
              {insights.modulos_sugeridos.map((modulo, i) => (
                <Card key={`${modulo.modulo}-${i}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm">{modulo.modulo}</p>
                      <Badge variant="secondary">Top {i + 1}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{modulo.porque}</p>
                    {!!modulo.dores_relacionadas?.length && (
                      <div className="flex flex-wrap gap-2">
                        {modulo.dores_relacionadas.map((dor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{dor}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-foreground uppercase mb-1">O que mostrar</p>
                      <p className="text-xs text-muted-foreground">{modulo.o_que_mostrar}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground uppercase">Perfil Predominante</h4>
            <Badge variant="secondary">{insights.perfil_predominante.nivel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{insights.perfil_predominante.caracteristicas}</p>
          <div className="flex flex-wrap gap-2">
            {insights.perfil_predominante.gaps_principais.map((gap, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {gap}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground uppercase flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Principais Dores Identificadas
        </h4>
        <div className="grid md:grid-cols-2 gap-3">
          {insights.principais_dores.map((dor, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground text-sm">{dor.dor}</p>
                  <Badge variant="destructive" className="text-xs flex-shrink-0">{dor.percentual_afetados}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{dor.descricao}</p>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs">
                    <span className="font-semibold text-primary">Conexão Orbit:</span>{" "}
                    <span className="text-foreground">{dor.conexao_orbit}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground uppercase flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Oportunidades de Venda
        </h4>
        <div className="space-y-3">
          {insights.oportunidades_orbit.map((op, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" /> {op.oportunidade}
                </p>
                <p className="text-xs text-muted-foreground">{op.descricao}</p>
                <div className="p-2 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-xs text-foreground italic">“{op.argumento_venda}”</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {insights.insights_por_setor.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground uppercase flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Insights por Setor
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {insights.insights_por_setor.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Badge variant="secondary" className="text-xs">{s.setor}</Badge>
                  <p className="text-sm text-foreground">{s.insight}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Abordagem:</span> {s.abordagem_sugerida}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground uppercase flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Recomendações Estratégicas
          </h4>
          <ul className="space-y-2">
            {insights.recomendacoes_estrategicas.map((rec, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">{i + 1}.</span> {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}