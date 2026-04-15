import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Lead, PRIORITY_COLORS, parseLeadDate, toDateKey } from "./lead-types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface CalendarViewProps {
  leads: Lead[];
  loading: boolean;
}

const CalendarView = ({ leads, loading }: CalendarViewProps) => {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const leadsByDateKey = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const lead of leads) {
      const d = parseLeadDate(lead.data_reuniao);
      if (!d) continue;
      const k = toDateKey(d);
      if (!map[k]) map[k] = [];
      map[k].push(lead);
    }
    return map;
  }, [leads]);

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calendarMonth]);

  const todayKey = toDateKey(new Date());

  const getDayKey = (day: number) => {
    return toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
  };

  const selectedLeads = selectedDay ? (leadsByDateKey[selectedDay] || []) : [];

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
        </h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Compact calendar grid */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarGrid.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="border-t border-r border-border h-8" />;
            }
            const key = getDayKey(day);
            const count = leadsByDateKey[key]?.length || 0;
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`
                  border-t border-r border-border h-8 flex items-center justify-center gap-0.5 transition-colors relative text-xs
                  ${isToday ? "bg-primary/10" : ""}
                  ${isSelected ? "bg-primary/20 ring-1 ring-primary ring-inset" : "hover:bg-muted/50"}
                `}
              >
                <span className={`text-xs ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                  {day}
                </span>
                {count > 0 && (
                  <span className="bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail - always visible */}
      {selectedDay && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="bg-secondary px-3 py-1.5 flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground text-sm">
              {(() => { const [y, m, d] = selectedDay.split("-"); return `${d}/${m}/${y}`; })()}
            </span>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
              {selectedLeads.length} demonstração(ões)
            </Badge>
          </div>
          {selectedLeads.length === 0 ? (
            <p className="text-muted-foreground text-center py-3 text-xs">Nenhuma demonstração neste dia.</p>
          ) : (
            <div className="divide-y divide-border">
              {selectedLeads
                .sort((a, b) => (a.horario_reuniao || "").localeCompare(b.horario_reuniao || ""))
                .map((lead) => (
                  <div key={lead.id} className="px-3 py-2 flex items-center gap-2">
                    <span className="text-primary font-mono font-bold text-xs w-10 shrink-0">
                      {lead.horario_reuniao}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs truncate">
                        {lead.nome} {lead.sobrenome} — {lead.empresa}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {lead.prioridade && (
                        <Badge className={`${PRIORITY_COLORS[lead.prioridade] || "bg-muted text-muted-foreground"} text-[9px] px-1 py-0`}>
                          {lead.prioridade.split("—")[0].trim()}
                        </Badge>
                      )}
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline"
                      >
                        WA
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
