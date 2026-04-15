import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CalendarPickerProps {
  onSelect: (date: string, time: string) => void;
  onRequestExecutive?: () => void;
  segmento?: string;
  cargo?: string;
  faturamento?: string;
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

// Brazilian national holidays 2026
const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Confraternização Universal",
  "2026-04-03": "Sexta-feira Santa",
  "2026-04-21": "Tiradentes",
  "2026-05-01": "Dia do Trabalho",
  "2026-09-07": "Independência do Brasil",
  "2026-10-12": "Nossa Sra. Aparecida",
  "2026-11-02": "Finados",
  "2026-11-15": "Proclamação da República",
  "2026-11-20": "Consciência Negra",
  "2026-12-25": "Natal",
};

// Capacity limit removed — unlimited seats

// Date when faturamento-based segmentation starts
const SEGMENTATION_START = new Date(2026, 2, 30); // 30/03/2026

interface TimeSlot {
  time: string;
  label: string;
}

interface SlotOccupancy {
  count: number;
}

function isHighRevenue(faturamento: string): boolean {
  const lower = faturamento.toLowerCase();
  // "Até R$ 100 mil/mês" is NOT high revenue
  if (lower.includes("até") && lower.includes("100 mil")) return false;
  return true;
}

function getAvailableSlots(
  segmento: string,
  cargo: string,
  faturamento: string,
  selectedDate: Date
): TimeSlot[] {
  // From 06/04/2026 (Monday): single 14:00 slot for ALL profiles (including consultors)
  const SINGLE_SLOT_START = new Date(2026, 3, 6); // 06/04/2026
  if (selectedDate >= SINGLE_SLOT_START) {
    return [{ time: "14:00", label: "" }];
  }

  const isConsultoria = segmento.toLowerCase().includes("consultoria");
  const isConsultor = cargo.toLowerCase().includes("consultor");
  const isConsultorProfile = isConsultoria || isConsultor;

  // Consultorias/Consultores → ONLY 18:00 (before 06/04)
  if (isConsultorProfile) {
    return [{ time: "18:00", label: "" }];
  }

  // Check if segmentation by faturamento applies (>= 30/03/2026)
  const useSegmentation = selectedDate >= SEGMENTATION_START;

  if (useSegmentation && faturamento) {
    const high = isHighRevenue(faturamento);
    if (high) {
      return [
        { time: "14:00", label: "" },
        { time: "17:00", label: "" },
      ];
    } else {
      return [
        { time: "09:00", label: "" },
        { time: "11:00", label: "" },
      ];
    }
  }

  // Before segmentation date: only 17:00
  return [
    { time: "17:00", label: "" },
  ];
}

function isHoliday(year: number, month: number, day: number): string | null {
  const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return HOLIDAYS_2026[key] || null;
}

// Scarcity indicators removed — unlimited seats

const CalendarPicker = ({ onSelect, onRequestExecutive, segmento = "", cargo = "", faturamento = "" }: CalendarPickerProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const getInitialDay = () => {
    const d = today.getDay();
    if (d === 0 || d === 6) return null;
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (HOLIDAYS_2026[key]) return null;
    return today.getDate();
  };

  const [selectedDay, setSelectedDay] = useState<number | null>(getInitialDay);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotOccupancy, setSlotOccupancy] = useState<Record<string, SlotOccupancy>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekdayNames = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado"
  ];

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const isWeekend = (day: number) => {
    const d = new Date(currentYear, currentMonth, day).getDay();
    return d === 0 || d === 6;
  };

  const now = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const todayWeekday = weekdayNames[now.getDay()];

  const isTimePast = (time: string) => {
    if (!selectedDay) return false;
    const selected = new Date(currentYear, currentMonth, selectedDay);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (selected.getTime() !== todayDate.getTime()) return false;
    const [h, m] = time.split(":").map(Number);
    const now2 = new Date();
    return h < now2.getHours() || (h === now2.getHours() && m <= now2.getMinutes());
  };

  const selectedDate = useMemo(() => {
    if (!selectedDay) return null;
    return new Date(currentYear, currentMonth, selectedDay);
  }, [selectedDay, currentYear, currentMonth]);

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    return getAvailableSlots(segmento, cargo, faturamento, selectedDate);
  }, [selectedDate, segmento, cargo, faturamento]);

  // Fetch slot occupancy when a day is selected
  useEffect(() => {
    if (!selectedDay) return;

    // For today (27/03/2026 transition day), skip occupancy check — show all slots as free
    const isTransitionToday = selectedDay === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear() &&
      new Date(currentYear, currentMonth, selectedDay) < SEGMENTATION_START;

    if (isTransitionToday) {
      setSlotOccupancy({});
      setLoadingSlots(false);
      return;
    }

    const dateStr = `${selectedDay}/${currentMonth + 1}/${currentYear}`;
    setLoadingSlots(true);

    supabase
      .from("leads")
      .select("horario_reuniao")
      .eq("data_reuniao", dateStr)
      .not("horario_reuniao", "is", null)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching slot occupancy:", error);
          setSlotOccupancy({});
          setLoadingSlots(false);
          return;
        }

        const occupancy: Record<string, SlotOccupancy> = {};
        (data || []).forEach((lead) => {
          const time = lead.horario_reuniao;
          if (!time) return;
          if (!occupancy[time]) {
            occupancy[time] = { count: 0 };
          }
          occupancy[time].count++;
        });
        setSlotOccupancy(occupancy);
        setLoadingSlots(false);
      });
    // `today` is a new Date() recreated each render; intentionally excluded to avoid re-fetching every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, currentMonth, currentYear]);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setIsSubmitting(true);
    setTimeout(() => loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    if (selectedDay) {
      const dateStr = `${selectedDay}/${currentMonth + 1}/${currentYear}`;
      setTimeout(() => {
        onSelect(dateStr, time);
      }, 1500);
    }
  };

  return (
    <>
      <div className="animate-fade-in-up space-y-6">
        {/* Header */}
        <div className="bg-[#F5F5F5] rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📅</span>
            <span className="font-bold text-[#0D1117]">Agenda hoje</span>
          </div>
          <p className="text-gray-500 text-sm">Para sua demonstração gratuita</p>
        </div>

        {/* Today badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-full px-4 py-2 text-sm text-gray-500 border border-gray-200">
            <MapPin className="w-3.5 h-3.5" />
            Hoje é {todayWeekday}, {nowStr}
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-[#0D1117]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-lg text-[#0D1117]">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button onClick={nextMonth} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-[#0D1117]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const past = isPast(day);
              const weekend = isWeekend(day);
              const holidayName = isHoliday(currentYear, currentMonth, day);
              const beyondLimit = (() => {
                const d = new Date(currentYear, currentMonth, day);
                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const currentDayOfWeek = todayDate.getDay();
                const daysUntilNextSunday = (7 - currentDayOfWeek) + 7;
                const limit = new Date(todayDate);
                limit.setDate(limit.getDate() + daysUntilNextSunday);
                return d > limit;
              })();
              const disabled = past || weekend || beyondLimit || !!holidayName;
              const selected = selectedDay === day;
              const todayDay = isToday(day);

              return (
                <button
                  key={day}
                  disabled={disabled}
                  title={holidayName || undefined}
                  onClick={() => { setSelectedDay(day); setSelectedTime(null); setTimeout(() => timeSlotsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300); }}
                  className={`h-10 w-full rounded-full text-sm transition-all duration-200 relative ${
                    selected
                      ? "bg-[#0D1117] text-white font-bold"
                      : todayDay
                      ? "bg-gray-100 text-[#0D1117] font-medium"
                      : disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#0D1117]"
                  }`}
                >
                  {day}
                  {holidayName && !past && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDay && (
          <div ref={timeSlotsRef} className="animate-fade-in-up">
            <h4 className="text-sm font-medium text-gray-500 mb-3">
              Horários para {selectedDay} de {monthNames[currentMonth].toLowerCase()}
            </h4>
            {loadingSlots ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum horário disponível para o seu perfil neste dia.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableSlots.map(({ time, label }) => {
                  const past = isTimePast(time);
                  const isDisabled = past;

                  return (
                    <button
                      key={time}
                      disabled={isDisabled}
                      onClick={() => handleTimeSelect(time)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        isDisabled
                          ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : selectedTime === time
                          ? "border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]"
                          : "border-gray-200 bg-[#F5F5F5] text-[#0D1117] hover:border-[#D4A017]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{time}</span>
                      </div>
                      {label && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">{label}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {isSubmitting && (
          <div ref={loadingRef} className="animate-fade-in-up flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 text-[#D4A017] animate-spin" />
            <p className="text-sm font-medium text-[#0D1117]">Agendando sua demonstração...</p>
            <p className="text-xs text-gray-500">Só um instante, estamos confirmando tudo para você!</p>
          </div>
        )}
        {/* Fallback: talk to executive */}
        {onRequestExecutive && !isSubmitting && (
          <div className="text-center pt-2">
            <button
              onClick={onRequestExecutive}
              className="text-sm text-[#D4A017] hover:underline font-medium transition-colors"
            >
              Não encontrou uma data? Fale com o executivo agora 💼
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarPicker;
