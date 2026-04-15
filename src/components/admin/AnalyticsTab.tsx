import { useState, useMemo, useRef } from "react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, subMonths } from "date-fns";
import { Lead, PRIORITY_COLORS } from "./lead-types";
import { COPY_VARIANTS } from "@/components/chat/copyVariants";
import { CONSULTOR_COPY_VARIANTS } from "@/components/chat/consultorCopyVariants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Users, Target, BarChart3, ArrowUpRight, ArrowDownRight,
  CalendarDays, ChevronDown, GripVertical, Download, CalendarIcon,
  CheckCircle, Clock, AlertTriangle, FlaskConical,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#eab308", "#22c55e", "#8b5cf6", "#ec4899", "#f97316"];

type PeriodPreset = "today" | "yesterday" | "7d" | "30d" | "this-month" | "last-month" | "90d" | "all" | "custom";
type SourceFilter = "all" | "principal" | "consultoria" | "contabilidade" | "clinicas" | "imobiliaria" | "engenharia" | "advocacia" | "franquias" | "ecommerce" | "educacao";

const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "this-month", label: "Este mês" },
  { id: "last-month", label: "Mês passado" },
  { id: "90d", label: "Últimos 90 dias" },
  { id: "all", label: "Todo o período" },
  { id: "custom", label: "Personalizado" },
];

function getPresetRange(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  const today = startOfDay(now);
  switch (preset) {
    case "today": return { from: today, to: endOfDay(now) };
    case "yesterday": return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
    case "7d": return { from: subDays(today, 6), to: endOfDay(now) };
    case "30d": return { from: subDays(today, 29), to: endOfDay(now) };
    case "this-month": return { from: startOfMonth(now), to: endOfDay(now) };
    case "last-month": {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfDay(new Date(lm.getFullYear(), lm.getMonth() + 1, 0)) };
    }
    case "90d": return { from: subDays(today, 89), to: endOfDay(now) };
    case "all": return { from: new Date("2020-01-01"), to: endOfDay(now) };
    case "custom": return { from: subDays(today, 29), to: endOfDay(now) };
  }
}

interface AnalyticsTabProps {
  leads: Lead[];
  loading: boolean;
}

const AnalyticsTab = ({ leads, loading }: AnalyticsTabProps) => {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const defaultSections = ["stats", "daily", "funnel", "copys-ref", "pie-charts", "bar-charts", "by-cargo", "recent-leads"];
  const [copyOrder, setCopyOrder] = useState<string[] | null>(null);
  const dragCopyItem = useRef<number | null>(null);
  const dragCopyOverItem = useRef<number | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultSections);
  const dragSection = useRef<number | null>(null);
  const dragOverSection = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const dateRange = useMemo(() => {
    if (periodPreset === "custom" && customFrom && customTo) {
      return { from: startOfDay(customFrom), to: endOfDay(customTo) };
    }
    return getPresetRange(periodPreset);
  }, [periodPreset, customFrom, customTo]);

  const periodLabel = useMemo(() => {
    if (periodPreset === "custom" && customFrom && customTo) {
      return `${format(customFrom, "dd/MM/yyyy")} - ${format(customTo, "dd/MM/yyyy")}`;
    }
    return PERIOD_PRESETS.find(p => p.id === periodPreset)?.label || "Período";
  }, [periodPreset, customFrom, customTo]);

  const metrics = useMemo(() => {
    if (!leads.length) return null;

    const { from: rangeFrom, to: rangeTo } = dateRange;
    const rangeDays = Math.max(1, Math.round((rangeTo.getTime() - rangeFrom.getTime()) / (24 * 60 * 60 * 1000)));

    const nichePathMap: Record<string, string> = {
      consultoria: "/consultoria",
      contabilidade: "/contabilidade",
      clinicas: "/clinicas",
      imobiliaria: "/imobiliaria",
      engenharia: "/engenharia",
      advocacia: "/advocacia",
      franquias: "/franquias",
      ecommerce: "/ecommerce",
      educacao: "/educacao",
    };

    const isFromNiche = (l: Lead, niche: string) => l.landing_page?.includes(nichePathMap[niche]);
    const isFromAnyNiche = (l: Lead) => Object.values(nichePathMap).some(path => l.landing_page?.includes(path));

    const sourceFilteredLeads = leads.filter((l) => {
      if (sourceFilter === "all") return true;
      if (sourceFilter === "principal") return !isFromAnyNiche(l);
      if (nichePathMap[sourceFilter]) return isFromNiche(l, sourceFilter);
      return true;
    });

    const filteredLeads = sourceFilteredLeads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= rangeFrom && d <= rangeTo;
    });

    // Previous period
    const prevFrom = new Date(rangeFrom.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const prevTo = new Date(rangeFrom.getTime() - 1);
    const prevLeads = sourceFilteredLeads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= prevFrom && d <= prevTo;
    });

    const growthRate = prevLeads.length > 0
      ? ((filteredLeads.length - prevLeads.length) / prevLeads.length) * 100
      : 0;

    // Leads by day
    const byDay: Record<string, number> = {};
    const completosByDay: Record<string, number> = {};
    const validVariants = sourceFilter === "consultoria" 
      ? ["CA", "CB", "CC", "CD", "CE"] 
      : sourceFilter === "principal" 
        ? ["A", "B", "C", "D", "E"] 
        : ["A", "B", "C", "D", "E", "CA", "CB", "CC", "CD", "CE"];
    const byDayCopy: Record<string, Record<string, number>> = {};
    filteredLeads.forEach((l) => {
      const day = format(new Date(l.created_at), "yyyy-MM-dd");
      byDay[day] = (byDay[day] || 0) + 1;
      if (l.status === "completo" || l.data_reuniao) {
        completosByDay[day] = (completosByDay[day] || 0) + 1;
      }
      if (l.copy_variant && validVariants.includes(l.copy_variant)) {
        if (!byDayCopy[day]) byDayCopy[day] = {};
        byDayCopy[day][l.copy_variant] = (byDayCopy[day][l.copy_variant] || 0) + 1;
      }
    });

    const dailyData: Record<string, any>[] = [];
    const copyKeys = sourceFilter === "consultoria" 
      ? ["CA", "CB", "CC", "CD", "CE"]
      : sourceFilter === "principal"
        ? ["A", "B", "C", "D", "E"]
        : ["A", "B", "C", "D", "E", "CA", "CB", "CC", "CD", "CE"];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(rangeTo.getTime() - i * 24 * 60 * 60 * 1000);
      const key = format(d, "yyyy-MM-dd");
      const dayCopy = byDayCopy[key] || {};
      const entry: Record<string, any> = {
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        leads: byDay[key] || 0,
        completos: completosByDay[key] || 0,
      };
      copyKeys.forEach(k => { entry[`copy${k}`] = dayCopy[k] || 0; });
      dailyData.push(entry);
    }

    // By status
    const byStatus: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const s = l.status || "parcial";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

    // By prioridade
    const byPrioridade: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const p = l.prioridade ? l.prioridade.split("—")[0].trim() : "Não informado";
      byPrioridade[p] = (byPrioridade[p] || 0) + 1;
    });
    const prioridadeData = Object.entries(byPrioridade)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // By faturamento
    const byFaturamento: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const f = l.faturamento || "Não informado";
      byFaturamento[f] = (byFaturamento[f] || 0) + 1;
    });
    const faturamentoData = Object.entries(byFaturamento)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name: name.length > 25 ? name.slice(0, 25) + "…" : name,
        value,
      }));

    // By funcionarios
    const byFuncionarios: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const f = l.funcionarios || "Não informado";
      byFuncionarios[f] = (byFuncionarios[f] || 0) + 1;
    });
    const funcionariosData = Object.entries(byFuncionarios)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // By cargo
    const byCargo: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const c = l.cargo || "Não informado";
      byCargo[c] = (byCargo[c] || 0) + 1;
    });
    const cargoData = Object.entries(byCargo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 20 ? name.slice(0, 20) + "…" : name,
        value,
      }));

    // By oque_faz (segmento)
    const bySegmento: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const s = l.oque_faz || "Não informado";
      bySegmento[s] = (bySegmento[s] || 0) + 1;
    });
    const segmentoData = Object.entries(bySegmento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 20 ? name.slice(0, 20) + "…" : name,
        value,
      }));

    // Reuniões agendadas
    const reunioesAgendadas = filteredLeads.filter(l => l.data_reuniao).length;
    const urgentes = filteredLeads.filter(l => l.prioridade?.includes("Urgente")).length;
    const completos = filteredLeads.filter(l => l.status === "completo" || l.data_reuniao).length;
    const parciais = filteredLeads.filter(l => !l.data_reuniao && l.status !== "completo").length;
    const conversionRate = filteredLeads.length > 0 ? Math.round((completos / filteredLeads.length) * 100) : 0;

    // A/B Copy Variant performance
    const variantMap: Record<string, { count: number; label: string }> = {};
    let variantTotal = 0;
    filteredLeads.forEach((l) => {
      const v = l.copy_variant;
      if (!v || !validVariants.includes(v)) return;
      if (!variantMap[v]) variantMap[v] = { count: 0, label: `Copy ${v}` };
      variantMap[v].count++;
      variantTotal++;
    });
    const variantData = Object.entries(variantMap)
      .map(([id, { count, label }]) => ({
        id,
        name: label,
        leads: count,
        pct: variantTotal > 0 ? Math.round((count / variantTotal) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    return {
      total: filteredLeads.length,
      totalAll: leads.length,
      growthRate,
      reunioesAgendadas,
      urgentes,
      completos,
      parciais,
      conversionRate,
      avgPerDay: rangeDays > 0 ? (filteredLeads.length / rangeDays).toFixed(1) : "0",
      dailyData,
      statusData,
      prioridadeData,
      faturamentoData,
      funcionariosData,
      cargoData,
      segmentoData,
      variantData,
      filteredLeads,
    };
  }, [leads, dateRange, sourceFilter]);

  const exportCSV = () => {
    if (!metrics) return;
    const header = "Nome,Sobrenome,WhatsApp,Email,Empresa,Segmento,Cargo,Faturamento,Funcionários,Prioridade,Data Demonstração,Horário,Status,Copy,Criado em\n";
    const rows = metrics.filteredLeads
      .map((l) =>
        [l.nome, l.sobrenome, l.whatsapp, l.email, l.empresa, l.oque_faz, l.cargo, l.faturamento, l.funcionarios, l.prioridade, l.data_reuniao, l.horario_reuniao, l.status, l.copy_variant, new Date(l.created_at).toLocaleDateString("pt-BR")]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-orbit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Carregando...</p>;
  }

  if (!metrics) {
    return <p className="text-muted-foreground text-center py-12">Nenhum dado disponível.</p>;
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    sub,
    trend,
  }: {
    icon: any;
    label: string;
    value: string | number;
    sub?: string;
    trend?: number;
  }) => (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center text-xs font-medium ${trend >= 0 ? "text-green-500" : "text-destructive"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  const DragHandle = () => (
    <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
  );

  const handleSectionDragStart = (idx: number) => { dragSection.current = idx; };
  const handleSectionDragEnter = (idx: number) => { dragOverSection.current = idx; };
  const handleSectionDragEnd = () => {
    if (dragSection.current === null || dragOverSection.current === null) return;
    const newOrder = [...sectionOrder];
    const [removed] = newOrder.splice(dragSection.current, 1);
    newOrder.splice(dragOverSection.current, 0, removed);
    setSectionOrder(newOrder);
    dragSection.current = null;
    dragOverSection.current = null;
  };

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  const sections: Record<string, React.ReactNode> = {
    /* ── Stats Cards ── */
    "stats": (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Leads no Período" value={metrics.total} sub={`${metrics.totalAll} no total`} />
        <StatCard icon={TrendingUp} label="Variação" value={`${metrics.growthRate >= 0 ? "+" : ""}${metrics.growthRate.toFixed(0)}%`} trend={metrics.growthRate} sub="vs período anterior" />
        <StatCard icon={BarChart3} label="Média/Dia" value={metrics.avgPerDay} />
        <StatCard icon={CalendarDays} label="Reuniões" value={metrics.reunioesAgendadas} />
        <StatCard icon={Target} label="Urgentes" value={metrics.urgentes} />
        <StatCard icon={CheckCircle} label="Conversão" value={`${metrics.conversionRate}%`} sub={`${metrics.completos} completos`} />
      </div>
    ),

    /* ── Daily Line Chart ── */
    "daily": (() => {
      const copyColors: Record<string, string> = {
        A: "#ef4444", B: "#f97316", C: "#eab308", D: "#8b5cf6", E: "#ec4899",
        CA: "#ef4444", CB: "#f97316", CC: "#eab308", CD: "#8b5cf6", CE: "#ec4899",
      };
      const activeCopyKeys = sourceFilter === "consultoria"
        ? ["CA", "CB", "CC", "CD", "CE"]
        : sourceFilter === "principal"
          ? ["A", "B", "C", "D", "E"]
          : ["A", "B", "C", "D", "E"];
      return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DragHandle />
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Leads por Dia</h2>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> Total</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: "#22c55e" }} /> Completos</span>
            {activeCopyKeys.map(k => (
              <span key={k} className="flex items-center gap-1">
                <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: copyColors[k] }} /> Copy {k}
              </span>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={isMobile ? 6 : Math.max(0, Math.floor(metrics.dailyData.length / 12))} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="leads" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="completos" name="Completos" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                {activeCopyKeys.map(k => (
                  <Line key={k} type="monotone" dataKey={`copy${k}`} name={`Copy ${k}`} stroke={copyColors[k]} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    })(),

    /* ── Conversion Funnel ── */
    "funnel": (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DragHandle />
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Funil de Conversão</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
              <p className="text-xs text-muted-foreground">Total de Leads</p>
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.parciais}</p>
              <p className="text-xs text-muted-foreground">Parciais</p>
              <p className="text-[10px] text-muted-foreground">{metrics.total > 0 ? Math.round((metrics.parciais / metrics.total) * 100) : 0}%</p>
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.completos}</p>
              <p className="text-xs text-muted-foreground">Completos</p>
              <p className="text-[10px] text-muted-foreground">{metrics.conversionRate}%</p>
            </div>
          </div>
        </div>
        {/* Funnel bars */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">Total</span>
            <div className="flex-1 h-4 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">Parciais</span>
            <div className="flex-1 h-4 bg-yellow-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${metrics.total > 0 ? (metrics.parciais / metrics.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">Completos</span>
            <div className="flex-1 h-4 bg-green-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics.conversionRate}%` }} />
            </div>
          </div>
        </div>
      </div>
    ),

    /* ── Copys em Rotação (A/B Test) ── */
    "copys-ref": (() => {
      const activeVariants = sourceFilter === "consultoria" 
        ? CONSULTOR_COPY_VARIANTS 
        : sourceFilter === "principal" 
          ? COPY_VARIANTS 
          : [...COPY_VARIANTS, ...CONSULTOR_COPY_VARIANTS];
      const validIds = activeVariants.map(v => v.id);
      const variantLeadCount: Record<string, number> = {};
      metrics.filteredLeads.forEach((l) => {
        if (l.copy_variant && validIds.includes(l.copy_variant)) {
          variantLeadCount[l.copy_variant] = (variantLeadCount[l.copy_variant] || 0) + 1;
        }
      });
      const defaultSorted = [...activeVariants].sort((a, b) => (variantLeadCount[b.id] || 0) - (variantLeadCount[a.id] || 0));
      const orderedIds = copyOrder && copyOrder.every(id => validIds.includes(id)) && copyOrder.length === validIds.length
        ? copyOrder 
        : defaultSorted.map(v => v.id);
      const ordered = orderedIds.map(id => activeVariants.find(v => v.id === id)!).filter(Boolean);
      const handleCopyDragStart = (idx: number) => { dragCopyItem.current = idx; };
      const handleCopyDragEnter = (idx: number) => { dragCopyOverItem.current = idx; };
      const handleCopyDragEnd = () => {
        if (dragCopyItem.current === null || dragCopyOverItem.current === null) return;
        const newOrder = [...orderedIds];
        const [removed] = newOrder.splice(dragCopyItem.current, 1);
        newOrder.splice(dragCopyOverItem.current, 0, removed);
        setCopyOrder(newOrder);
        dragCopyItem.current = null;
        dragCopyOverItem.current = null;
      };
      const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
      const medalLabels = ["🥇", "🥈", "🥉"];
      const sectionTitle = sourceFilter === "consultoria" 
        ? "Copys Consultoria (A/B Test)" 
        : sourceFilter === "principal" 
          ? "Copys Principal (A/B Test)" 
          : "Copys em Rotação (A/B Test)";
      return (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DragHandle />
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{sectionTitle}</h2>
          </div>
          <div className="grid gap-3">
            {ordered.map((v, idx) => {
              const count = variantLeadCount[v.id] || 0;
              const medalBorder = idx < 3 ? medalColors[idx] : undefined;
              return (
                <div key={v.id} draggable onDragStart={(e) => { e.stopPropagation(); handleCopyDragStart(idx); }} onDragEnter={(e) => { e.stopPropagation(); handleCopyDragEnter(idx); }} onDragEnd={(e) => { e.stopPropagation(); handleCopyDragEnd(); }} onDragOver={(e) => e.preventDefault()} className="rounded-lg border p-3 space-y-1 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md" style={{ borderColor: medalBorder || "hsl(var(--border))", borderWidth: idx < 3 ? 2 : 1, backgroundColor: idx < 3 ? `${medalColors[idx]}08` : "hsl(var(--muted) / 0.3)" }}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    {idx < 3 && <span className="text-base">{medalLabels[idx]}</span>}
                    <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">Copy {v.id}</span>
                    <span className="text-xs font-semibold text-foreground">{count} leads</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{v.headline} <span className="text-primary">{v.highlightedPart}</span></p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    })(),

    /* ── Pie Charts ── */
    "pie-charts": (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><DragHandle /><h2 className="text-sm font-semibold text-foreground">Por Status</h2></div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {metrics.statusData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><DragHandle /><h2 className="text-sm font-semibold text-foreground">Por Prioridade</h2></div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.prioridadeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {metrics.prioridadeData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    ),

    /* ── Bar Charts (Faturamento + Funcionários) ── */
    "bar-charts": (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><DragHandle /><h2 className="text-sm font-semibold text-foreground">💰 Por Faturamento</h2></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.faturamentoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={isMobile ? 80 : 140} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><DragHandle /><h2 className="text-sm font-semibold text-foreground">👥 Por Funcionários</h2></div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.funcionariosData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {metrics.funcionariosData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    ),

    /* ── By Cargo + Segmento ── */
    "by-cargo": (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><DragHandle /><h2 className="text-sm font-semibold text-foreground">🏢 Top Cargos</h2></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.cargoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={isMobile ? 80 : 120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><DragHandle /><h2 className="text-sm font-semibold text-foreground">🏭 Top Segmentos</h2></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.segmentoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={isMobile ? 80 : 120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    ),

    /* ── Recent Leads Table ── */
    "recent-leads": (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DragHandle />
          <h2 className="text-sm font-semibold text-foreground">Últimos 10 Leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Nome</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Empresa</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">WhatsApp</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Prioridade</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Demonstração</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {metrics.filteredLeads.slice(0, 10).map((l) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium text-foreground whitespace-nowrap">{l.nome} {l.sobrenome}</td>
                  <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{l.empresa}</td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      {l.whatsapp}
                    </a>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    {l.prioridade ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PRIORITY_COLORS[l.prioridade] || "bg-muted text-muted-foreground"}`}>
                        {l.prioridade.split("—")[0].trim()}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">
                    {l.data_reuniao ? `${l.data_reuniao} ${l.horario_reuniao || ""}` : "—"}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      l.status === "completo" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {l.status || "parcial"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {metrics.filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead no período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector + Export */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">📊 Dashboard de Analytics</h2>
            <p className="text-sm text-muted-foreground">{metrics.total} leads no período · {metrics.totalAll} total</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>

          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{periodLabel}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col sm:flex-row">
                <div className="border-b sm:border-b-0 sm:border-r border-border p-2 min-w-[160px]">
                  {PERIOD_PRESETS.filter(p => p.id !== "custom").map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPeriodPreset(p.id);
                        if (p.id !== "custom") setPeriodOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        periodPreset === p.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => setPeriodPreset("custom")}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        periodPreset === "custom" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                      )}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>
                {periodPreset === "custom" && (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>De</span>
                      <Input
                        type="date"
                        value={customFrom ? format(customFrom, "yyyy-MM-dd") : ""}
                        onChange={(e) => setCustomFrom(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                        className="h-8 text-xs w-[140px]"
                      />
                      <span>até</span>
                      <Input
                        type="date"
                        value={customTo ? format(customTo, "yyyy-MM-dd") : ""}
                        onChange={(e) => setCustomTo(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                        className="h-8 text-xs w-[140px]"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!customFrom || !customTo}
                      onClick={() => setPeriodOpen(false)}
                    >
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Origem:</span>
          {([
            { id: "all" as SourceFilter, label: "Todas" },
            { id: "principal" as SourceFilter, label: "LP Principal" },
            { id: "consultoria" as SourceFilter, label: "Consultoria" },
            { id: "contabilidade" as SourceFilter, label: "Contabilidade" },
            { id: "clinicas" as SourceFilter, label: "Clínicas" },
            { id: "imobiliaria" as SourceFilter, label: "Imobiliária" },
            { id: "engenharia" as SourceFilter, label: "Engenharia" },
            { id: "advocacia" as SourceFilter, label: "Advocacia" },
            { id: "franquias" as SourceFilter, label: "Franquias" },
            { id: "ecommerce" as SourceFilter, label: "E-commerce" },
            { id: "educacao" as SourceFilter, label: "Educação" },
          ]).map((s) => (
            <Button
              key={s.id}
              variant={sourceFilter === s.id ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => { setSourceFilter(s.id); setCopyOrder(null); }}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Draggable Sections */}
      {sectionOrder.map((key, idx) => {
        const content = sections[key];
        if (!content) return null;
        return (
          <div
            key={key}
            draggable
            onDragStart={() => handleSectionDragStart(idx)}
            onDragEnter={() => handleSectionDragEnter(idx)}
            onDragEnd={handleSectionDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="transition-shadow"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsTab;
