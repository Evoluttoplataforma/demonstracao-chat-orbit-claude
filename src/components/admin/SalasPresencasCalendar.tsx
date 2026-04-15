import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Users, ExternalLink, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Presenca {
  id: string;
  sala_id: string;
  horario_id: string;
  data_sessao: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  created_at: string;
  ligacao_confirmacao_enviada?: boolean;
}

interface Sala {
  id: string;
  nome: string;
  categoria: string;
}

const SalasPresencasCalendar = () => {
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string>("treinamento_inicial");
  const [callingId, setCallingId] = useState<string | null>(null);

  const handleConfirmationCall = async (presencaId: string, nome: string) => {
    setCallingId(presencaId);
    try {
      const { data, error } = await supabase.functions.invoke("confirmation-call", {
        body: { presencaId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Ligação iniciada para ${nome}`);
      // Refresh presencas
      const { data: fresh } = await supabase.from("sala_presencas").select("*").order("data_sessao");
      setPresencas((fresh as Presenca[]) || []);
    } catch (err: any) {
      console.error("Call failed:", err);
      toast.error(`Erro ao ligar: ${err.message || "erro desconhecido"}`);
    } finally {
      setCallingId(null);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        supabase.from("sala_presencas").select("*").order("data_sessao"),
        supabase.from("salas").select("id, nome, categoria"),
      ]);
      setPresencas((pRes.data as Presenca[]) || []);
      setSalas((sRes.data as Sala[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const salaIdsByCategoria = useMemo(() => {
    const map: Record<string, Set<string>> = {
      treinamento_inicial: new Set(),
      ativacao_canal: new Set(),
      tira_duvidas: new Set(),
    };
    for (const s of salas) {
      const cat = s.categoria.startsWith("tira_duvidas") ? "tira_duvidas" : s.categoria;
      if (map[cat]) map[cat].add(s.id);
    }
    return map;
  }, [salas]);

  const salaNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of salas) m[s.id] = s.nome;
    return m;
  }, [salas]);

  const filtered = useMemo(() => {
    const ids = salaIdsByCategoria[categoria];
    if (!ids) return [];
    return presencas.filter((p) => ids.has(p.sala_id));
  }, [presencas, salaIdsByCategoria, categoria]);

  const byDate = useMemo(() => {
    const map: Record<string, Presenca[]> = {};
    for (const p of filtered) {
      if (!map[p.data_sessao]) map[p.data_sessao] = [];
      map[p.data_sessao].push(p);
    }
    return map;
  }, [filtered]);

  const calendarGrid = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [month]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const getDayKey = (day: number) => {
    const y = month.getFullYear();
    const m = month.getMonth();
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const selectedPresencas = selectedDay ? byDate[selectedDay] || [] : [];

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={categoria} onValueChange={(v) => { setCategoria(v); setSelectedDay(null); }}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="treinamento_inicial">Treinamento Inicial</TabsTrigger>
          <TabsTrigger value="ativacao_canal">Ativação Canal</TabsTrigger>
          <TabsTrigger value="tira_duvidas">Tira-dúvidas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {calendarGrid.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const key = getDayKey(day);
              const count = byDate[key]?.length || 0;
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  className={`
                    relative p-1 h-14 border border-border/50 text-xs transition-colors
                    ${isToday ? "bg-primary/10" : ""}
                    ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}
                  `}
                >
                  <span className={`block text-[11px] ${isToday ? "font-bold text-primary" : "text-foreground"}`}>
                    {day}
                  </span>
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">
                      <Users className="h-2.5 w-2.5 mr-0.5" />{count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:w-72 shrink-0">
          {selectedDay ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                {new Date(selectedDay + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </h4>
              <p className="text-xs text-muted-foreground">{selectedPresencas.length} confirmado(s)</p>
              {selectedPresencas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma presença neste dia.</p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {selectedPresencas.map((p) => (
                    <div key={p.id} className="border border-border rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{p.nome}</p>
                        {p.whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={callingId === p.id || p.ligacao_confirmacao_enviada}
                            title={p.ligacao_confirmacao_enviada ? "Ligação já enviada" : "Ligar para confirmar"}
                            onClick={() => handleConfirmationCall(p.id, p.nome)}
                          >
                            {callingId === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Phone className={`h-3 w-3 ${p.ligacao_confirmacao_enviada ? "text-muted-foreground" : "text-primary"}`} />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                      {p.empresa && <p className="text-xs text-muted-foreground font-medium">{p.empresa}</p>}
                      <p className="text-[10px] text-muted-foreground">{salaNameMap[p.sala_id] || "—"}</p>
                      {p.whatsapp && (
                        <a
                          href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Selecione um dia para ver os confirmados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalasPresencasCalendar;
