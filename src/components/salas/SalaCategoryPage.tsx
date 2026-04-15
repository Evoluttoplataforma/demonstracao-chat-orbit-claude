import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle, Video, ArrowLeft, MapPin, CalendarPlus,
} from "lucide-react";
import { toast } from "sonner";
import orbitLogo from "@/assets/orbit-icon.png";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Sala {
  id: string;
  nome: string;
  descricao: string;
  link_sala: string;
}

interface Horario {
  id: string;
  sala_id: string;
  tipo: string;
  dia_semana: number | null;
  data_especifica: string | null;
  horario: string;
}

interface SessionSlot {
  horario: Horario;
  sala: Sala;
  dateStr: string;
  time: string;
  label: string;
}

interface SalaCategoryPageProps {
  categoria: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  onBack?: () => void;
  prerequisite?: React.ReactNode;
}

function buildSessionMap(salas: Sala[], horarios: Horario[]): Map<string, SessionSlot[]> {
  const now = new Date();
  const map = new Map<string, SessionSlot[]>();

  for (const sala of salas) {
    const salaHorarios = horarios.filter((h) => h.sala_id === sala.id);
    for (const h of salaHorarios) {
      if (h.tipo === "especifico" && h.data_especifica) {
        const [y, m, d] = h.data_especifica.split("-").map(Number);
        const [hh, mm] = h.horario.split(":").map(Number);
        const dt = new Date(y, m - 1, d, hh, mm);
        if (dt > now) {
          const key = h.data_especifica;
          const slot: SessionSlot = {
            horario: h,
            sala,
            dateStr: key,
            time: h.horario.slice(0, 5),
            label: `${h.horario.slice(0, 5)} — ${sala.nome}`,
          };
          map.set(key, [...(map.get(key) || []), slot]);
        }
      } else if (h.tipo === "recorrente" && h.dia_semana != null) {
        for (let w = 0; w < 8; w++) {
          const dt = new Date(now);
          dt.setDate(dt.getDate() + ((7 + h.dia_semana - dt.getDay()) % 7) + w * 7);
          const [hh, mm] = h.horario.split(":").map(Number);
          dt.setHours(hh, mm, 0, 0);
          if (dt > now) {
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
            const slot: SessionSlot = {
              horario: h,
              sala,
              dateStr: key,
              time: h.horario.slice(0, 5),
              label: `${h.horario.slice(0, 5)} — ${sala.nome}`,
            };
            map.set(key, [...(map.get(key) || []), slot]);
          }
        }
      }
    }
  }

  // Sort each day's slots by time
  for (const [key, slots] of map) {
    map.set(key, slots.sort((a, b) => a.time.localeCompare(b.time)));
  }

  return map;
}

export default function SalaCategoryPage({ categoria, title, subtitle, description, icon, onBack, prerequisite }: SalaCategoryPageProps) {
  const navigate = useNavigate();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SessionSlot | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", empresa: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("salas").select("id, nome, descricao, link_sala").eq("ativo", true).eq("categoria", categoria),
      supabase.from("sala_horarios").select("id, sala_id, tipo, dia_semana, data_especifica, horario").eq("ativo", true),
    ]).then(([salasRes, horariosRes]) => {
      const salasData = (salasRes.data as Sala[]) || [];
      const horariosData = (horariosRes.data as Horario[]) || [];
      // Filter horarios to only salas in this category
      const salaIds = new Set(salasData.map((s) => s.id));
      setSalas(salasData);
      setHorarios(horariosData.filter((h) => salaIds.has(h.sala_id)));
      setLoading(false);
    });
  }, [categoria]);

  const sessionMap = useMemo(() => buildSessionMap(salas, horarios), [salas, horarios]);

  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentMonth, currentYear]);
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentMonth, currentYear]);

  const selectedDateKey = useMemo(() => {
    if (!selectedDay) return null;
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  }, [selectedDay, currentMonth, currentYear]);

  const slotsForDay = useMemo(() => {
    if (!selectedDateKey) return [];
    return sessionMap.get(selectedDateKey) || [];
  }, [selectedDateKey, sessionMap]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const isWeekend = (day: number) => {
    const dow = new Date(currentYear, currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  const hasSession = (day: number) => {
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return sessionMap.has(key);
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handleSelectSlot = (slot: SessionSlot) => {
    setSelectedSlot(slot);
    setForm({ nome: "", email: "", whatsapp: "", empresa: "" });
    setConfirmed(false);
    setConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.empresa.trim()) {
      toast.error("Nome, empresa e e-mail são obrigatórios");
      return;
    }
    if (!selectedSlot) return;
    setSubmitting(true);
    const { error } = await supabase.from("sala_presencas").insert({
      sala_id: selectedSlot.sala.id,
      horario_id: selectedSlot.horario.id,
      data_sessao: selectedSlot.dateStr,
      nome: form.nome,
      email: form.email,
      whatsapp: form.whatsapp,
      empresa: form.empresa,
    } as any);
    setSubmitting(false);
    if (error) { toast.error("Erro ao confirmar presença"); return; }
    setConfirmed(true);
    toast.success("Presença confirmada!");

    // Send confirmation email (fire-and-forget)
    try {
      await supabase.functions.invoke("send-sala-confirmation", {
        body: {
          nome: form.nome,
          email: form.email,
          sala_nome: selectedSlot.sala.nome,
          categoria,
          data_sessao: selectedSlot.dateStr,
          horario: selectedSlot.time,
          link_sala: selectedSlot.sala.link_sala,
        },
      });
    } catch (emailErr) {
      console.warn("Failed to send confirmation email:", emailErr);
    }
  };

  const now = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const weekdayNames = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack || (() => navigate("/salas"))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <img src={orbitLogo} alt="Orbit" className="h-8" />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-8 w-full">
        {/* Info section */}
        <div className="space-y-6 mb-8">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
          {prerequisite && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
              {prerequisite}
            </div>
          )}
        </div>

        {salas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhuma sala disponível no momento.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/salas")}>Voltar</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Calendar header */}
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📅</span>
                <span className="font-bold text-foreground">Escolha uma data</span>
              </div>
              <p className="text-muted-foreground text-sm">Selecione um dia com sessão disponível</p>
            </div>

            {/* Today badge */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-sm text-muted-foreground border border-border">
                <MapPin className="w-3.5 h-3.5" />
                Hoje é {weekdayNames[now.getDay()]}, {nowStr}
              </div>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-semibold text-lg text-foreground">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <button onClick={nextMonth} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="border border-border rounded-xl p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((d, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const past = isPast(day);
                  const weekend = isWeekend(day);
                  const available = hasSession(day);
                  const disabled = past || weekend || !available;
                  const selected = selectedDay === day;
                  const todayDay = isToday(day);

                  return (
                    <button
                      key={day}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDay(day);
                        setSelectedSlot(null);
                        setTimeout(() => timeSlotsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                      }}
                      className={`h-10 w-full rounded-full text-sm transition-all duration-200 relative ${
                        selected
                          ? "bg-foreground text-background font-bold"
                          : todayDay && available
                          ? "bg-primary/20 text-primary font-semibold"
                          : available
                          ? "text-foreground font-medium hover:bg-muted"
                          : "text-muted-foreground/25 cursor-not-allowed"
                      }`}
                    >
                      {day}
                      {available && !past && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Sessão disponível
              </div>
            </div>

            {/* Time slots */}
            {selectedDay && (
              <div ref={timeSlotsRef} className="animate-fade-in space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Horários para {selectedDay} de {MONTH_NAMES[currentMonth].toLowerCase()}
                </h4>
                {slotsForDay.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum horário disponível neste dia.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {slotsForDay.map((slot, i) => (
                      <button
                        key={`${slot.horario.id}-${i}`}
                        onClick={() => handleSelectSlot(slot)}
                        className="py-3 px-4 rounded-xl border border-border bg-secondary text-sm font-medium transition-all duration-200 flex items-center justify-between hover:border-primary/50 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-foreground">{slot.time}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {slot.sala.nome.replace(/\s*\(.*?\)\s*$/, '')} ({weekdayNames[new Date(currentYear, currentMonth, selectedDay!).getDay()]})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmed ? "Presença Confirmada!" : "Confirmar Presença"}</DialogTitle>
          </DialogHeader>
          {confirmed ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <p className="text-lg font-medium text-foreground">Tudo certo!</p>
              <p className="text-muted-foreground">
                Sua presença na sala <strong>{selectedSlot?.sala.nome}</strong> está confirmada para{" "}
                <strong>{selectedSlot && new Date(selectedSlot.dateStr + "T12:00").toLocaleDateString("pt-BR")} às {selectedSlot?.time}</strong>.
              </p>
              <div className="flex flex-col items-center gap-3">
                {selectedSlot?.sala.link_sala && (
                  <a
                    href={selectedSlot.sala.link_sala}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Video className="h-5 w-5" />
                    Link da sala
                  </a>
                )}
                <div className="flex flex-row items-center justify-center gap-3">
                  {/* Google Calendar */}
                  <a
                    href={(() => {
                      if (!selectedSlot) return "#";
                      const [y, m, d] = selectedSlot.dateStr.split("-").map(Number);
                      const [hh, mm] = selectedSlot.time.split(":").map(Number);
                      const start = new Date(y, m - 1, d, hh, mm);
                      const durationHrs = categoria === "onboarding" ? 3 : 1;
                      const end = new Date(start.getTime() + durationHrs * 60 * 60 * 1000);
                      const fmt = (dt: Date) =>
                        dt.getFullYear().toString() +
                        (dt.getMonth() + 1).toString().padStart(2, "0") +
                        dt.getDate().toString().padStart(2, "0") +
                        "T" +
                        dt.getHours().toString().padStart(2, "0") +
                        dt.getMinutes().toString().padStart(2, "0") +
                        "00";
                      const sessionType = categoria === "onboarding" ? "Onboarding Orbit" : "Tira-Dúvidas Orbit";
                      const params = new URLSearchParams({
                        action: "TEMPLATE",
                        text: `${sessionType} — ${selectedSlot.sala.nome}`,
                        dates: `${fmt(start)}/${fmt(end)}`,
                        details: `Link da sala: ${selectedSlot.sala.link_sala || ""}`,
                        location: selectedSlot.sala.link_sala || "Online",
                      });
                      return `https://calendar.google.com/calendar/render?${params.toString()}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors text-sm"
                  >
                    <CalendarPlus className="h-5 w-5" />
                    Google Agenda
                  </a>
                  {/* Download .ics */}
                  <button
                    onClick={() => {
                      if (!selectedSlot) return;
                      const [y, m, d] = selectedSlot.dateStr.split("-").map(Number);
                      const [hh, mm] = selectedSlot.time.split(":").map(Number);
                      const startUTC = new Date(Date.UTC(y, m - 1, d, hh + 3, mm, 0));
                      const durationHrs = categoria === "onboarding" ? 3 : 1;
                      const endUTC = new Date(startUTC.getTime() + durationHrs * 60 * 60 * 1000);
                      const fmt = (dt: Date) =>
                        dt.getUTCFullYear().toString() +
                        (dt.getUTCMonth() + 1).toString().padStart(2, "0") +
                        dt.getUTCDate().toString().padStart(2, "0") +
                        "T" +
                        dt.getUTCHours().toString().padStart(2, "0") +
                        dt.getUTCMinutes().toString().padStart(2, "0") +
                        "00Z";
                      const now2 = new Date();
                      const uid = `orbit-sala-${now2.getTime()}@orbitgestao.com.br`;
                      const sessionType = categoria === "onboarding" ? "Onboarding Orbit" : "Tira-Dúvidas Orbit";
                      const ics = [
                        "BEGIN:VCALENDAR",
                        "VERSION:2.0",
                        "PRODID:-//Orbit Gestão//Salas//PT",
                        "CALSCALE:GREGORIAN",
                        "METHOD:REQUEST",
                        "BEGIN:VEVENT",
                        `UID:${uid}`,
                        `DTSTAMP:${fmt(now2)}`,
                        `DTSTART:${fmt(startUTC)}`,
                        `DTEND:${fmt(endUTC)}`,
                        `SUMMARY:${sessionType} — ${selectedSlot.sala.nome}`,
                        `DESCRIPTION:Sessão de ${sessionType.toLowerCase()} com o time Orbit.\\nLink: ${selectedSlot.sala.link_sala || ""}`,
                        `LOCATION:${selectedSlot.sala.link_sala || "Online"}`,
                        "STATUS:CONFIRMED",
                        "TRANSP:TRANSPARENT",
                        `ORGANIZER;CN=Orbit Gestão:mailto:demonstracao@orbitgestao.com.br`,
                        "BEGIN:VALARM",
                        "TRIGGER:-PT30M",
                        "ACTION:DISPLAY",
                        "DESCRIPTION:Sessão Orbit em 30 minutos",
                        "END:VALARM",
                        "END:VEVENT",
                        "END:VCALENDAR",
                      ].join("\r\n");
                      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sessao-orbit-${selectedSlot.dateStr}.ics`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors text-sm"
                  >
                    <CalendarPlus className="h-5 w-5" />
                    Baixar .ics
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{selectedSlot?.sala.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSlot && new Date(selectedSlot.dateStr + "T12:00").toLocaleDateString("pt-BR")} às {selectedSlot?.time}
                </p>
              </div>
              <div>
                <Label>Nome *</Label>
                <Input placeholder="Seu nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <Label>Empresa *</Label>
                <Input placeholder="Nome da sua empresa" value={form.empresa} onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))} />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>WhatsApp (opcional)</Label>
                <Input placeholder="(11) 99999-9999" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
              </div>
              <Button onClick={handleConfirm} disabled={submitting} className="w-full">
                {submitting ? "Confirmando..." : "Confirmar presença"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Orbit Gestão · Todos os direitos reservados
      </footer>
    </div>
  );
}
