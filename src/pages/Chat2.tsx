import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/phone";
import { pushFormSubmitSuccess } from "@/lib/dataLayer";
import { getMeetingLink } from "@/lib/meeting-link";
import avatarImg from "@/assets/avatar-consultant.jpg";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import CalendarPicker from "@/components/chat/CalendarPicker";
import ConfirmationScreen from "@/components/chat/ConfirmationScreen";
import DiagnosticInlineFlow from "@/components/chat/DiagnosticInlineFlow";
import { getSessionVariant } from "@/components/chat/copyVariants";
import execGabriel from "@/assets/exec-gabriel.png";
import execGisele from "@/assets/exec-gisele.png";
import execPedro from "@/assets/exec-pedro.png";
import execThayane from "@/assets/exec-thayane.png";
import { ArrowUp, Play, Pause, Volume2, Mic } from "lucide-react";

const EXECUTIVES: Record<string, { nome: string; foto: string; whatsapp: string }> = {
  gabriel: { nome: "Gabriel Carvente", foto: execGabriel, whatsapp: "5511971999192" },
  gisele: { nome: "Gisele Ferrarezi", foto: execGisele, whatsapp: "5548991206282" },
  pedro: { nome: "Pedro", foto: execPedro, whatsapp: "5548996934524" },
  thayane: { nome: "Thayane Torbis", foto: execThayane, whatsapp: "5548996934515" },
};

function matchExecutive(ownerName: string) {
  const lower = ownerName.toLowerCase();
  for (const [key, exec] of Object.entries(EXECUTIVES)) {
    if (lower.includes(key)) return exec;
  }
  return null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  showTranscript?: boolean;
  options?: string[];
  ctaLink?: { label: string; url: string };
}

// Audio message bubble with play/pause + transcribe
function AudioBubble({ audioUrl, transcript, onToggleTranscript, showTranscript }: {
  audioUrl: string;
  transcript: string;
  onToggleTranscript: () => void;
  showTranscript: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <img src={avatarImg} alt="Olívia" className="w-14 h-14 rounded-full object-cover object-[center_20%] flex-shrink-0 border-2 border-[#D4A017]/30" />
      <div className="space-y-1 max-w-xs">
      <div className="bg-[#F0F0F0] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3 min-w-[220px]">
          <button onClick={toggle} className="w-10 h-10 rounded-full bg-[#D4A017] text-white flex items-center justify-center shrink-0 hover:bg-[#b8891a] transition-colors">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <div className="h-full bg-[#D4A017] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-500 mt-0.5 block">
              {duration > 0 ? `0:${Math.floor(duration).toString().padStart(2, "0")}` : "0:00"}
            </span>
          </div>
          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>
        <button onClick={onToggleTranscript} className="text-xs text-[#D4A017] hover:text-[#b8891a] font-medium px-1 transition-colors">
          {showTranscript ? "Ocultar transcrição" : "Transcrever"}
        </button>
        {showTranscript && (
          <div className="bg-[#F8F8F8] border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-700 animate-fade-in-up">
            {transcript}
          </div>
        )}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
        />
      </div>
    </div>
  );
}

// Text message from Olívia
function BotBubble({ text }: { text: string }) {
  // Support markdown links and **bold**
  const renderText = () => {
    const combinedRegex = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      if (match[1]) {
        parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(
          <a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline font-semibold hover:text-[#b8891a]">
            {match[4]}
          </a>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length > 0 ? <>{parts}</> : text;
  };

  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <img src={avatarImg} alt="Olívia" className="w-14 h-14 rounded-full object-cover object-[center_20%] flex-shrink-0 border-2 border-[#D4A017]/30" />
      <div className="bg-[#F0F0F0] text-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm max-w-xs leading-relaxed text-lg">
        {renderText()}
      </div>
    </div>
  );
}

// User message bubble
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-in-up">
      <div className="bg-[#D4A017] text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-xs text-lg font-medium">
        {text}
      </div>
    </div>
  );
}

// Typing indicator
function TypingDots() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <img src={avatarImg} alt="Olívia" className="w-14 h-14 rounded-full object-cover object-[center_20%] flex-shrink-0 border-2 border-[#D4A017]/30" />
      <div className="bg-[#F0F0F0] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "0s" }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "0.2s" }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

function RecordingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <img src={avatarImg} alt="Olívia" className="w-14 h-14 rounded-full object-cover object-[center_20%] flex-shrink-0 border-2 border-[#D4A017]/30" />
      <div className="bg-[#F0F0F0] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <Mic className="w-4 h-4 text-gray-400 animate-pulse" />
        </div>
        <span className="text-sm text-gray-500 font-medium">Gravando áudio...</span>
        <div className="flex items-center gap-0.5">
          {[...Array(7)].map((_, i) => (
            <span key={i} className="w-0.5 bg-gray-300 rounded-full animate-pulse" style={{ height: `${6 + Math.random() * 12}px`, animationDelay: `${i * 0.12}s`, animationDuration: "0.6s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
// Inline lead form (appears after discovery phase)
function InlineLeadForm({ onSubmit, isSubmitting, leadName, leadEmpresa }: {
  onSubmit: (data: { nome: string; whatsapp: string; email: string; empresa: string }) => void;
  isSubmitting: boolean;
  leadName: string;
  leadEmpresa: string;
}) {
  const [form, setForm] = useState({ nome: leadName, whatsapp: "", email: "", empresa: leadEmpresa });
  const [phoneFull, setPhoneFull] = useState("+55");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Preencha seu nome";
    const digits = phoneFull.replace(/\D/g, "");
    if (digits.length < 12) errs.whatsapp = "WhatsApp inválido";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Email inválido";
    if (!form.empresa.trim()) errs.empresa = "Preencha o nome da empresa";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit({ ...form, whatsapp: phoneFull });
  };

  const textFields = [
    { key: "nome", label: "Nome completo", type: "text", placeholder: "Seu nome" },
    { key: "email", label: "E-mail", type: "email", placeholder: "seu@email.com" },
    { key: "empresa", label: "Empresa", type: "text", placeholder: "Nome da empresa" },
  ];

  return (
    <div className="animate-fade-in-up pl-0 sm:pl-[52px]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <form noValidate onSubmit={handleSubmit} className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-3 max-w-sm relative z-10 text-[hsl(var(--primary-foreground))]">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Seus dados</p>
        {textFields.map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(e) => { setForm(prev => ({ ...prev, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: "" })); }}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={placeholder}
              spellCheck={false}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white text-[hsl(var(--primary-foreground))] caret-[hsl(var(--primary))] placeholder:text-muted-foreground outline-none transition-colors ${errors[key] ? "border-[hsl(var(--destructive))] focus:border-[hsl(var(--destructive))]" : "border-gray-200 focus:border-[hsl(var(--primary))]"}`}
              autoComplete={key === "email" ? "email" : "off"}
            />
            {errors[key] && <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>}
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">WhatsApp</label>
          <div onMouseDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <PhoneInputWithCountry
              onValueChange={(full, raw) => {
                setPhoneFull(full);
                setForm(prev => ({ ...prev, whatsapp: raw }));
                setErrors(prev => ({ ...prev, whatsapp: "" }));
              }}
            />
          </div>
          {errors.whatsapp && <p className="text-xs text-red-500 mt-0.5">{errors.whatsapp}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#D4A017] hover:bg-[#b8891a] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? "Enviando..." : "Continuar ✨"}
        </button>
      </form>
    </div>
  );
}

const Chat2 = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, string | null>>({
    nome: null, sobrenome: null, whatsapp: null, email: null, empresa: null,
    segmento: null, cargo: null, faturamento: null, funcionarios: null, projetos_ativos: null, prioridade: null,
    cidade: null, interesse: null, desafio: null, validacao_confirmada: null,
  });
  const collectedDataRef = useRef(collectedData);
  useEffect(() => { collectedDataRef.current = collectedData; }, [collectedData]);
  const [qualificationStatus, setQualificationStatus] = useState<string>("collecting");
  const [nextAction, setNextAction] = useState<string | null>(null);
  const [isConsultor, setIsConsultor] = useState(false);
  

  // Lead tracking refs (same pattern as /chat)
  const leadIdRef = useRef<string | null>(null);
  const pipedriveIdsRef = useRef<{ person_id?: number; org_id?: number; deal_id?: number }>({});
  const utmDataRef = useRef<Record<string, string>>({});
  const savingLeadRef = useRef(false);
  const pageStartRef = useRef(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);

  // Calendar/confirmation/form state
  const [showCalendar, setShowCalendar] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showVendedor, setShowVendedor] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [matchedExec, setMatchedExec] = useState<{ nome: string; foto: string; whatsapp: string } | null>(null);
  const [loadingExec, setLoadingExec] = useState(false);
  const [resolvedMeetLink, setResolvedMeetLink] = useState("");
  const [calendarData, setCalendarData] = useState({ date: "", time: "" });
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [pendingOptions, setPendingOptions] = useState<string[] | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  // Parse UTMs and detect niche on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "gbraid", "wbraid", "ttclid", "msclkid", "li_fat_id", "sck", "gad_source", "gad_campaignid"].forEach((k) => {
      const v = params.get(k);
      if (v) utms[k] = v;
    });
    utmDataRef.current = utms;

    // Send welcome audio
    sendWelcomeAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendWelcomeAudio = async () => {
    setIsLoading(true);
    
    // Detect time of day for greeting
    const hour = new Date().getHours();
    const timeGreeting = hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";

    const welcomeText = `${timeGreeting}! Eu sou a Olívia, da Orbit Gestão! Estou aqui pra te mostrar como Gestão com IA pode transformar o seu negócio. Me conta, qual é o seu nome, e de qual cidade você fala?`;

    // Try TTS but always show text as fallback
    let audioUrl: string | undefined;
    setIsRecordingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat2-tts", {
        body: { text: welcomeText },
      });
      if (!error && data?.audio) {
        audioUrl = `data:audio/mpeg;base64,${data.audio}`;
      }
    } catch (e) {
      console.warn("TTS unavailable, using text-only:", e);
    }
    setIsRecordingAudio(false);

    setMessages([{
      role: "assistant",
      content: welcomeText,
      ...(audioUrl ? { audioUrl, showTranscript: false } : {}),
    }]);
    conversationRef.current.push({ role: "assistant", content: welcomeText });

    setIsLoading(false);
    scrollToBottom();
  };

  // Save partial lead (same logic as /chat)
  const savePartialLead = async (data: Record<string, string | null>) => {
    if (savingLeadRef.current || !data.nome || !data.whatsapp || !data.email) return;

    // Fire conversion event on first complete form. `pushFormSubmitSuccess`
    // dedupes per session internally, so re-edits won't double-count.
    try {
      const nameParts = (data.nome || "").trim().split(/\s+/);
      const convNome = nameParts[0] || "";
      const convSobrenome = data.sobrenome || nameParts.slice(1).join(" ") || "";
      const convPhoneDigits = (data.whatsapp || "").replace(/\D/g, "");
      let sid = sessionStorage.getItem("apex_session_id");
      if (!sid) {
        sid = Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem("apex_session_id", sid);
      }
      pushFormSubmitSuccess({
        email: data.email,
        phoneNumber: convPhoneDigits.replace(/^55/, ""),
        nome: convNome,
        sobrenome: convSobrenome,
        apex_session_id: sid,
        time_on_page_at_submit: Math.round((Date.now() - (pageStartRef.current || Date.now())) / 1000),
      });
    } catch (e) {
      console.error("dataLayer push error:", e);
    }

    if (leadIdRef.current) {
      try {
        await supabase.from("leads").update({
          nome: data.nome,
          sobrenome: data.sobrenome || "",
          whatsapp: normalizePhone(data.whatsapp),
          email: data.email,
        }).eq("id", leadIdRef.current);
      } catch (err) { console.error("Failed to update lead:", err); }
      return;
    }
    savingLeadRef.current = true;
    try {
      const copyVariant = sessionStorage.getItem("hero_copy_variant") || getSessionVariant().id;
      const phoneDigits = data.whatsapp.replace(/\D/g, "");

      const { data: existing } = await supabase.from("leads")
        .select("id")
        .or(`email.eq.${data.email},whatsapp.ilike.%${phoneDigits}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const payload = {
        nome: data.nome,
        sobrenome: data.sobrenome || "",
        whatsapp: normalizePhone(data.whatsapp),
        email: data.email,
        empresa: data.empresa || "",
        status: "parcial",
        copy_variant: copyVariant,
        origin_page: window.location.pathname === "/" ? "/chat2-ab" : window.location.pathname,
        ...utmDataRef.current,
      };

      if (existing) {
        await supabase.from("leads").update(payload).eq("id", existing.id);
        leadIdRef.current = existing.id;
      } else {
        const { data: inserted } = await supabase.from("leads").insert(payload).select("id").single();
        if (inserted) leadIdRef.current = inserted.id;
      }

      // Sync to Make.com + notify
      if (leadIdRef.current) {
        supabase.functions.invoke("sync-lead-make", { body: { lead_id: leadIdRef.current } }).catch(() => {});
        supabase.functions.invoke("sync-lead-crm", {
          body: { nome: `${data.nome} ${data.sobrenome || ""}`.trim(), email: data.email, whatsapp: normalizePhone(data.whatsapp), empresa: data.empresa || "" },
        }).catch(() => {});
        // Notify new lead via email
        supabase.functions.invoke("notify-new-lead", { body: payload }).catch(() => {});
      }
    } catch (err) { console.error("Failed to save lead:", err); }
    finally { savingLeadRef.current = false; }
  };

  const createPipedrive = async (data: Record<string, string | null>) => {
    if (pipedriveIdsRef.current.deal_id || !data.nome || !data.email || !data.empresa) return;
    try {
      const copyVariant = sessionStorage.getItem("hero_copy_variant") || getSessionVariant().id;
      // Map projetos_ativos to funcionarios for consultors
      const funcValue = data.funcionarios || data.projetos_ativos || undefined;
      const { data: result } = await supabase.functions.invoke("create-pipedrive-lead", {
        body: {
          action: "create",
          name: `${data.nome} ${data.sobrenome || ""}`.trim(),
          whatsapp: data.whatsapp,
          email: data.email,
          empresa: data.empresa,
          leadId: leadIdRef.current,
          copyVariant,
          oqueFaz: data.segmento || undefined,
          cargo: data.cargo || undefined,
          faturamento: data.faturamento || undefined,
          funcionarios: funcValue,
          prioridade: data.prioridade || undefined,
          utmData: utmDataRef.current,
        },
      });
      if (result?.success) {
        pipedriveIdsRef.current = { person_id: result.person_id, org_id: result.org_id, deal_id: result.deal_id };
        if (leadIdRef.current) {
          await supabase.from("leads").update({
            empresa: data.empresa,
            pipedrive_person_id: result.person_id,
            pipedrive_org_id: result.org_id,
            pipedrive_deal_id: result.deal_id,
          }).eq("id", leadIdRef.current);
        }

        // Add CHAT2 label — AWAIT to prevent race conditions with subsequent label calls
        await supabase.functions.invoke("create-pipedrive-lead", {
          body: { action: "add_label", deal_id: result.deal_id, label_name: "CHAT2", label_color: "blue" },
        }).catch((e) => console.error("[Chat2] Failed to add CHAT2 label:", e));

        // Send accumulated qualification fields that were collected before the deal existed
        const pendingPipeFields: Record<string, unknown> = {};
        if (data.faturamento) pendingPipeFields.faturamento = data.faturamento;
        if (data.funcionarios || data.projetos_ativos) pendingPipeFields.funcionarios = data.funcionarios || data.projetos_ativos;
        if (data.prioridade) pendingPipeFields.prioridade = data.prioridade;
        if (data.cargo) pendingPipeFields.cargo = data.cargo;
        if (data.segmento) pendingPipeFields.oqueFaz = data.segmento;
        if (Object.keys(pendingPipeFields).length > 0) {
          await supabase.functions.invoke("create-pipedrive-lead", {
            body: { action: "update", ...pipedriveIdsRef.current, ...pendingPipeFields },
          }).catch(() => {});
        }

        // Send conversation context as a note right after creation
        sendConversationNote(result.deal_id, data);
      }
    } catch (err) { console.error("Pipedrive create failed:", err); }
  };

  const sendConversationNote = (dealId: number, data: Record<string, string | null>) => {
    const noteLines: string[] = ["💬 Contexto da conversa (Chat IA)"];
    if (data.cidade) noteLines.push(`📍 Cidade: ${data.cidade}`);
    if (data.interesse) noteLines.push(`🎯 O que chamou atenção: ${data.interesse}`);
    if (data.desafio) noteLines.push(`⚡ Principal desafio: ${data.desafio}`);
    if (data.segmento) noteLines.push(`💼 Segmento: ${data.segmento}`);
    if (data.cargo) noteLines.push(`👤 Cargo: ${data.cargo}`);
    if (data.faturamento) noteLines.push(`💰 Faturamento: ${data.faturamento}`);
    if (data.funcionarios) noteLines.push(`👥 Funcionários: ${data.funcionarios}`);
    if (data.projetos_ativos) noteLines.push(`📊 Projetos ativos: ${data.projetos_ativos}`);
    if (data.prioridade) noteLines.push(`⏰ Prioridade: ${data.prioridade}`);

    // Append full conversation transcript
    const transcript = conversationRef.current
      .map(m => m.role === "user" ? `👤 Lead: ${m.content}` : `🤖 Olívia: ${m.content}`)
      .join("\n");
    if (transcript) {
      noteLines.push("");
      noteLines.push("───────────────────");
      noteLines.push("📝 Transcrição completa da conversa:");
      noteLines.push("");
      noteLines.push(transcript);
    }

    if (noteLines.length > 1) {
      supabase.functions.invoke("create-pipedrive-lead", {
        body: { action: "add_note", deal_id: dealId, note_content: noteLines.join("\n") },
      }).catch(() => {});
    }
  };

  const updateLead = async (fields: Record<string, unknown>, pipedrivePayload?: Record<string, unknown>) => {
    if (leadIdRef.current) {
      try {
        await supabase.from("leads").update(fields).eq("id", leadIdRef.current);
      } catch (err) {
        console.error("updateLead: failed to update leads row", err);
      }
    }
    if (pipedrivePayload && pipedriveIdsRef.current.deal_id) {
      try {
        await supabase.functions.invoke("create-pipedrive-lead", {
          body: { action: "update", ...pipedriveIdsRef.current, ...pipedrivePayload },
        });
      } catch (err) {
        console.error("updateLead: failed to sync pipedrive", err);
      }
    }
  };

  const sendCommitmentAudioThenCalendar = async () => {
    const nome = collectedDataRef.current.nome || "você";
    const commitText = `${nome}, antes de agendar, preciso te falar uma coisa importante! A demonstração é ao vivo, com vagas limitadas. Quando você agenda, a gente reserva um lugar especial pra você. Então se não puder ir, me avisa antes, tá? Porque se não aparece, sobra cadeira vazia e a gente fica triste! Brincadeira... mas sério, sua presença faz toda diferença. Bora agendar?`;

    // Show recording indicator while generating audio
    setIsRecordingAudio(true);
    let audioUrl: string | undefined;
    try {
      const { data: ttsData } = await supabase.functions.invoke("chat2-tts", {
        body: { text: commitText },
      });
      if (ttsData?.audio) {
        audioUrl = `data:audio/mpeg;base64,${ttsData.audio}`;
      }
    } catch (err) {
      console.error("sendCommitmentAudio: TTS failed", err);
    }
    setIsRecordingAudio(false);

    // Audio message with confirmation button
    const commitMsg: ChatMessage = {
      role: "assistant",
      content: commitText,
      audioUrl,
      showTranscript: false,
      options: ["✅ Entendido Olívia, vou participar!"],
    };
    setMessages(prev => [...prev, commitMsg]);
    conversationRef.current.push({ role: "assistant", content: commitText });
    scrollToBottom();
  };


  const processAIResponse = async (aiResponse: {
    message: string;
    extracted_data: Record<string, string | null>;
    qualification_status: string;
    is_consultor: boolean;
    next_action: string | null;
    options?: string[] | null;
    should_send_audio: boolean;
    audio_context?: string;
  }) => {
    // Sanitize message: remove any leaked JSON from the message text
    let cleanMessage = aiResponse.message || "";
    // If message contains JSON object pattern, extract only the text before it
    const jsonStart = cleanMessage.indexOf('{ "message"');
    if (jsonStart > 0) {
      cleanMessage = cleanMessage.substring(0, jsonStart).trim();
    } else if (jsonStart === 0) {
      // Entire message is JSON - try to parse and extract the real message
      try {
        const inner = JSON.parse(cleanMessage);
        cleanMessage = inner.message || cleanMessage;
      } catch {
        // not valid JSON; keep raw text
      }
    }
    // Remove trailing JSON fragments
    cleanMessage = cleanMessage.replace(/\{[\s]*"message"[\s\S]*$/, "").trim();
    aiResponse.message = cleanMessage;
    // Merge extracted data
    const newData = { ...collectedDataRef.current };
    let changed = false;
    const currentlyExtracted: Record<string, string> = {};
    for (const [key, value] of Object.entries(aiResponse.extracted_data || {})) {
      if (value !== null && value !== "" && newData[key] !== value) {
        newData[key] = value as string;
        currentlyExtracted[key] = value as string;
        changed = true;
      }
    }
    if (changed) {
      setCollectedData(newData);
      collectedDataRef.current = newData;
      
      // Save partial lead ONLY when form data is freshly submitted (not from AI extraction of just a name)
      // The form submit handler (handleFormSubmit) handles initial save.
      // Here we only update if the lead already exists in DB
      if (leadIdRef.current && (currentlyExtracted.nome || currentlyExtracted.cidade)) {
        // Only update name/city fields, don't trigger full save with stale data
        const nameUpdate: Record<string, unknown> = {};
        if (currentlyExtracted.nome) nameUpdate.nome = currentlyExtracted.nome;
        if (leadIdRef.current) {
          supabase.from("leads").update(nameUpdate).eq("id", leadIdRef.current).then(() => {});
        }
      }

      // Create Pipedrive when we have empresa AND it was just extracted or form was just submitted
      if (currentlyExtracted.empresa && newData.nome && newData.email) {
        await createPipedrive(newData);
      }

      // Update lead DB fields progressively - only for fields JUST extracted
      const dbFields: Record<string, unknown> = {};
      const pipeFields: Record<string, unknown> = {};
      if (currentlyExtracted.segmento) { dbFields.oque_faz = currentlyExtracted.segmento; pipeFields.oqueFaz = currentlyExtracted.segmento; }
      if (currentlyExtracted.cargo) { dbFields.cargo = currentlyExtracted.cargo; pipeFields.cargo = currentlyExtracted.cargo; }
      if (currentlyExtracted.faturamento) { dbFields.faturamento = currentlyExtracted.faturamento; pipeFields.faturamento = currentlyExtracted.faturamento; }
      if (currentlyExtracted.funcionarios) { dbFields.funcionarios = currentlyExtracted.funcionarios; pipeFields.funcionarios = currentlyExtracted.funcionarios; }
      if (currentlyExtracted.projetos_ativos) { dbFields.funcionarios = currentlyExtracted.projetos_ativos; pipeFields.funcionarios = currentlyExtracted.projetos_ativos; }
      if (currentlyExtracted.prioridade) { dbFields.prioridade = currentlyExtracted.prioridade; pipeFields.prioridade = currentlyExtracted.prioridade; }
      if (Object.keys(dbFields).length > 0) {
        await updateLead(dbFields, pipeFields);
      }

      // Send updated conversation note only when NEW meaningful data was extracted
      if (pipedriveIdsRef.current.deal_id && (currentlyExtracted.interesse || currentlyExtracted.desafio || currentlyExtracted.cidade || currentlyExtracted.faturamento || currentlyExtracted.prioridade)) {
        sendConversationNote(pipedriveIdsRef.current.deal_id, newData);
      }
    }

    setQualificationStatus(aiResponse.qualification_status);
    setIsConsultor(aiResponse.is_consultor);

    // Note: DESQUALIFICADO ORBIT label is applied in handleFormSubmit (after form confirmation)
    // and in "Quero testar o Orbit" button handler — NOT here, to avoid duplicates.

    // Handle next actions
    let skipAIMessage = false;
    if (aiResponse.next_action) {
      setNextAction(aiResponse.next_action);
      switch (aiResponse.next_action) {
        case "show_form":
          setShowForm(true);
          break;
        case "calendar":
          skipAIMessage = true; // commitment audio replaces the AI message
          await sendCommitmentAudioThenCalendar();
          break;
        case "diagnostic":
          setShowDiagnostic(true);
          break;
        case "executive":
          handleRequestExecutive();
          break;
        case "test_orbit":
          if (pipedriveIdsRef.current.deal_id) {
            supabase.functions.invoke("create-pipedrive-lead", {
              body: { action: "add_label", deal_id: pipedriveIdsRef.current.deal_id, label_name: "CLICOU TESTE", label_color: "yellow" },
            }).catch(() => {});
          }
          {
            const nome = collectedDataRef.current.nome || "Você";
            const farewellMsg: ChatMessage = {
              role: "assistant",
              content: `${nome}, ótima escolha! 🚀 Você pode começar a testar o Orbit agora mesmo — qualquer dúvida, estamos aqui! Boa jornada! 💪`,
              ctaLink: { label: "🚀 Acessar o Orbit", url: "https://app.orbitgestao.com.br/register" },
            };
            setMessages(prev => [...prev, farewellMsg]);
            conversationRef.current.push({ role: "assistant", content: farewellMsg.content });
            skipAIMessage = true;
          }
          break;
        case "lost":
          if (pipedriveIdsRef.current.deal_id) {
            supabase.functions.invoke("create-pipedrive-lead", {
              body: { action: "update", ...pipedriveIdsRef.current, status: "lost" },
            }).catch(() => {});
          }
          break;
      }
    }

    if (skipAIMessage) return;

    // Generate audio if needed
    let audioUrl: string | undefined;
    if (aiResponse.should_send_audio) {
      setIsRecordingAudio(true);
      try {
        const { data } = await supabase.functions.invoke("chat2-tts", {
          body: { text: aiResponse.message },
        });
        if (data?.audio) {
          audioUrl = `data:audio/mpeg;base64,${data.audio}`;
        }
      } catch (err) {
        console.error("processAIResponse: TTS failed", err);
      }
      setIsRecordingAudio(false);
    } else {
      setIsRecordingAudio(false);
    }

    // Add bot message - if audio + options, hold options behind "Entendido" button
    const hasOptions = aiResponse.options && aiResponse.options.length > 0;
    const holdOptions = hasOptions && audioUrl;
    
    if (holdOptions) {
      setPendingOptions(aiResponse.options!);
    }
    
    const botMsg: ChatMessage = {
      role: "assistant",
      content: aiResponse.message,
      audioUrl,
      showTranscript: false,
      options: holdOptions ? undefined : (hasOptions ? aiResponse.options! : undefined),
    };
    setMessages(prev => [...prev, botMsg]);
    conversationRef.current.push({ role: "assistant", content: aiResponse.message });
    scrollToBottom();
  };

  const handleRequestExecutive = async () => {
    const currentData = collectedDataRef.current;
    setShowVendedor(true);
    setLoadingExec(true);
    updateLead({ deseja_contato_vendedor: true }, {});
    
    const dealId = pipedriveIdsRef.current.deal_id;
    if (dealId) {
      supabase.functions.invoke("create-pipedrive-lead", {
        body: { action: "add_label", deal_id: dealId, label_name: "DIRETO EXECUTIVO", label_color: "green" },
      }).catch(() => {});

      try {
        const { data: assignResult } = await supabase.functions.invoke("assign-pipedrive-owner", {
          body: { deal_id: dealId, flow: "vendedor" },
        });
        if (assignResult?.assigned_user?.name) {
          const exec = matchExecutive(assignResult.assigned_user.name);
          if (exec) setMatchedExec(exec);
        }
        supabase.functions.invoke("get-pipedrive-owners", {
          body: { leads: [], add_note: { deal_id: dealId, content: `<b>📞 Lead solicitou contato com executivo (via chat2 IA)</b>` } },
        }).catch(() => {});
        if (currentData.whatsapp) {
          supabase.functions.invoke("tag-manychat", {
            body: {
              action: "tag",
              whatsapp: currentData.whatsapp,
              tag_name: "foi-falar-com-vendedor",
              lead_data: {
                nome: currentData.nome,
                sobrenome: currentData.sobrenome,
                email: currentData.email,
              },
            },
          }).catch(() => {});
        }
      } catch (err) {
        console.error("handleRequestExecutive: pipedrive/manychat failed", err);
      }

      // Send final conversation note with full transcript
      sendConversationNote(dealId, currentData);
    }
    setLoadingExec(false);
  };

  const handleOptionClick = async (option: string, msgIndex: number) => {
    // Remove options from the clicked message
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, options: undefined } : m));
    
    // Treat as user message
    const userMsg: ChatMessage = { role: "user", content: option };
    setMessages(prev => [...prev, userMsg]);
    conversationRef.current.push({ role: "user", content: option });
    scrollToBottom();

    // If this is the commitment confirmation, show calendar directly
    if (option.includes("Entendido") && option.includes("vou participar")) {
      setShowCalendar(true);
      scrollToBottom();
      return;
    }

    // Handle validation confirmation — "Estão certas" marks data as confirmed (step 1)
    if (option.includes("Estão certas")) {
      const updated = { ...collectedDataRef.current, validacao_confirmada: "sim" };
      setCollectedData(updated);
      collectedDataRef.current = updated;
    }

    // Handle budget acceptance — "Sim, faz sentido" marks budget as accepted (step 2)
    if (option.includes("faz sentido")) {
      const updated = { ...collectedDataRef.current, validacao_confirmada: "budget_aceito" };
      setCollectedData(updated);
      collectedDataRef.current = updated;
    }

    // Handle correction — clear faturamento + funcionarios/projetos so AI re-asks
    if (option.includes("quero corrigir")) {
      const updated = { ...collectedDataRef.current, faturamento: null, funcionarios: null, projetos_ativos: null, validacao_confirmada: null };
      setCollectedData(updated);
      collectedDataRef.current = updated;
    }

    // Handle "Quero testar o Orbit" from budget screen — skip form entirely
    if (option.includes("Quero testar o Orbit")) {
      if (pipedriveIdsRef.current.deal_id) {
        supabase.functions.invoke("create-pipedrive-lead", {
          body: { action: "add_label", deal_id: pipedriveIdsRef.current.deal_id, label_name: "CLICOU TESTE", label_color: "yellow" },
        }).catch(() => {});
        supabase.functions.invoke("create-pipedrive-lead", {
          body: { action: "add_label", deal_id: pipedriveIdsRef.current.deal_id, label_name: "DESQUALIFICADO ORBIT", label_color: "red" },
        }).catch(() => {});
      }
      const nome = collectedDataRef.current.nome || "Você";
      const farewellMsg: ChatMessage = {
        role: "assistant",
        content: `${nome}, ótima escolha! 🚀 Você pode começar a testar o Orbit agora mesmo — qualquer dúvida, estamos aqui! Boa jornada! 💪`,
        ctaLink: { label: "🚀 Acessar o Orbit", url: "https://app.orbitgestao.com.br/register" },
      };
      setMessages(prev => [...prev, farewellMsg]);
      conversationRef.current.push({ role: "assistant", content: farewellMsg.content });
      scrollToBottom();
      setIsLoading(false);
      return;
    }

    setIsRecordingAudio(false);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat2-ai", {
        body: {
          messages: conversationRef.current,
          collected_data: collectedDataRef.current,
        },
      });

      if (error) {
        console.error("chat2-ai error:", error);
        setIsRecordingAudio(false);
        const errorMsg: ChatMessage = { role: "assistant", content: "Desculpa, tive um probleminha aqui. Pode repetir? 😅" };
        setMessages(prev => [...prev, errorMsg]);
        conversationRef.current.push({ role: "assistant", content: errorMsg.content });
      } else {
        await processAIResponse(data);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setIsRecordingAudio(false);
      const errorMsg: ChatMessage = { role: "assistant", content: "Ops, algo deu errado. Tenta de novo? 😊" };
      setMessages(prev => [...prev, errorMsg]);
    }

    setIsLoading(false);
    scrollToBottom();
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    conversationRef.current.push({ role: "user", content: trimmed });
    scrollToBottom();

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat2-ai", {
        body: {
          messages: conversationRef.current,
          collected_data: collectedDataRef.current,
        },
      });

      if (error) {
        console.error("chat2-ai error:", error);
        const errorMsg: ChatMessage = { role: "assistant", content: "Desculpa, tive um probleminha aqui. Pode repetir? 😅" };
        setMessages(prev => [...prev, errorMsg]);
        conversationRef.current.push({ role: "assistant", content: errorMsg.content });
      } else {
        await processAIResponse(data);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMsg: ChatMessage = { role: "assistant", content: "Ops, algo deu errado. Tenta de novo? 😊" };
      setMessages(prev => [...prev, errorMsg]);
    }

    setIsLoading(false);
    scrollToBottom();
  };

  const handleFormSubmit = async (formData: { nome: string; whatsapp: string; email: string; empresa: string }) => {
    setShowForm(false);
    setIsRecordingAudio(true);
    setIsLoading(true);

    const newData = {
      ...collectedDataRef.current,
      nome: formData.nome.split(" ")[0],
      sobrenome: formData.nome.split(" ").slice(1).join(" ") || null,
      whatsapp: formData.whatsapp,
      email: formData.email,
      empresa: formData.empresa,
    };
    setCollectedData(newData);
    collectedDataRef.current = newData;

    const confirmMsg: ChatMessage = { role: "user", content: `✅ ${formData.nome} | ${formData.empresa}` };
    setMessages(prev => [...prev, confirmMsg]);
    conversationRef.current.push({ role: "user", content: `Dados cadastrais preenchidos: Nome: ${formData.nome}, Empresa: ${formData.empresa}, Email: ${formData.email}, WhatsApp: ${formData.whatsapp}` });

    // Fire DB save + Pipedrive + AI call ALL in parallel (AI doesn't depend on lead/pipedrive IDs)
    const isDesqAtForm = collectedDataRef.current.validacao_confirmada === "budget_aceito";
    // Consultoria desqualificada: ≤30k AND ≤2 projetos — still gets label + Gabriel, even though no budget message is shown
    const fat = (collectedDataRef.current.faturamento || "").toLowerCase();
    const proj = (collectedDataRef.current.projetos_ativos || "").toLowerCase();
    const isConsultorDesq = isConsultor && fat.includes("até") && fat.includes("30") && (proj.includes("1-2") || proj.includes("1 a 2"));
    const shouldApplyDesqLabel = isDesqAtForm || isConsultorDesq;
    const crmPromise = (async () => {
      await savePartialLead(newData);
      await createPipedrive(newData);
      // Add DESQUALIFICADO ORBIT label after Pipedrive deal exists
      if (shouldApplyDesqLabel && pipedriveIdsRef.current.deal_id) {
        await supabase.functions.invoke("create-pipedrive-lead", {
          body: { action: "add_label", deal_id: pipedriveIdsRef.current.deal_id, label_name: "DESQUALIFICADO ORBIT", label_color: "red" },
        }).catch(() => {});
        supabase.functions.invoke("assign-pipedrive-owner", {
          body: { deal_id: pipedriveIdsRef.current.deal_id, flow: "gabriel_direto" },
        }).catch(() => {});
      }
    })();

    const aiPromise = supabase.functions.invoke("chat2-ai", {
      body: {
        messages: conversationRef.current,
        collected_data: newData,
      },
    });

    try {
      // Wait for both — AI response is the critical path
      const [, aiResult] = await Promise.all([crmPromise.catch(e => console.error("CRM save error:", e)), aiPromise]);
      const { data, error } = aiResult;

      if (!error && data) {
        const budgetAccepted = collectedDataRef.current.validacao_confirmada === "budget_aceito";
        if (data.qualification_status !== "disqualified" || budgetAccepted) {
          data.should_send_audio = true;
        } else {
          data.should_send_audio = false;
        }
        await processAIResponse(data);
      } else {
        const fallbackText = `Ótimo, ${formData.nome.split(" ")[0]}! Seus dados foram salvos com sucesso. Agora vou analisar o perfil da ${formData.empresa} pra te direcionar da melhor forma, tá?`;
        setIsRecordingAudio(true);
        let audioUrl: string | undefined;
        try {
          const { data: ttsData } = await supabase.functions.invoke("chat2-tts", {
            body: { text: fallbackText },
          });
          if (ttsData?.audio) {
            audioUrl = `data:audio/mpeg;base64,${ttsData.audio}`;
          }
        } catch (err) {
          console.error("fallback TTS failed", err);
        }
        setIsRecordingAudio(false);
        const errMsg: ChatMessage = { role: "assistant", content: fallbackText, audioUrl, showTranscript: false };
        setMessages(prev => [...prev, errMsg]);
        conversationRef.current.push({ role: "assistant", content: fallbackText });
      }
    } catch (err) {
      console.error("AI response flow failed", err);
      const errMsg: ChatMessage = { role: "assistant", content: "Obrigada! Vamos continuar a qualificação. Qual o segmento da sua empresa?" };
      setMessages(prev => [...prev, errMsg]);
    }

    setIsLoading(false);
    scrollToBottom();
  };

  const handleCalendarSelect = async (date: string, time: string) => {
    // Use ref to get latest collected data (state may be stale due to async React updates)
    const cd = collectedDataRef.current;
    setCalendarData({ date, time });
    
    const emGrupoDealId = pipedriveIdsRef.current.deal_id;
    if (emGrupoDealId) {
      supabase.functions.invoke("create-pipedrive-lead", {
        body: { action: "add_label", deal_id: emGrupoDealId, label_name: "EM GRUPO", label_color: "blue" },
      }).catch(() => {});
    }

    const meetLink = getMeetingLink(cd.faturamento || "", cd.cargo || "", cd.segmento || "");
    const leadName = `${cd.nome ?? ""} ${cd.sobrenome ?? ""}`.trim();
    const canSendCalendarInvite = Boolean(cd.email && leadName && date && time);
    const canTagManyChat = Boolean(cd.whatsapp);
    setResolvedMeetLink(meetLink);

    if (leadIdRef.current) {
      await supabase.from("leads").update({
        data_reuniao: date, horario_reuniao: time, status: "completo",
        ligacao_agendada: true, link_reuniao: meetLink,
      }).eq("id", leadIdRef.current);
      supabase.functions.invoke("sync-lead-make", { body: { lead_id: leadIdRef.current } }).catch(() => {});
    }

    if (cd.whatsapp && leadName) {
      try {
        const [dd, mm, yyyy] = date.split("/");
        const callDatetime = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time}:00-03:00`;
        const phone = cd.whatsapp.startsWith("+") ? cd.whatsapp : `+55${cd.whatsapp.replace(/\D/g, "")}`;
        await supabase.functions.invoke("trigger-n8n-call", {
          body: { lead_name: leadName, lead_phone: phone, call_datetime: callDatetime, deal_id: pipedriveIdsRef.current.deal_id || null },
        });
      } catch (err) {
        console.error("trigger-n8n-call failed", err);
      }
    }

    updateLead({}, {
      name: leadName,
      whatsapp: cd.whatsapp, email: cd.email, empresa: cd.empresa,
      oqueFaz: cd.segmento, cargo: cd.cargo, faturamento: cd.faturamento,
      funcionarios: cd.funcionarios, prioridade: cd.prioridade,
      date, time, utmData: utmDataRef.current,
    });

    if (canSendCalendarInvite) {
      try {
        await supabase.functions.invoke("send-calendar-invite", {
          body: { email: cd.email, name: leadName, date, time, meetingLink: meetLink },
        });
      } catch (err) {
        console.error("send-calendar-invite failed", err);
      }
    } else {
      console.warn("Skipping send-calendar-invite: missing required scheduling data");
    }

    if (canTagManyChat) {
      supabase.functions.invoke("tag-manychat", {
        body: {
          action: "tag",
          whatsapp: cd.whatsapp,
          tag_name: "agendou-reuniao",
          lead_data: { nome: cd.nome, email: cd.email, empresa: cd.empresa, data_reuniao: date, horario_reuniao: time, link_reuniao: meetLink },
        },
      }).catch(() => {});
    } else {
      console.warn("Skipping tag-manychat: missing whatsapp for agendamento");
    }

    // Assign owner (skip if desqualificado)
    const fat = (cd.faturamento || "").toLowerCase();
    const func = (cd.funcionarios || "").toLowerCase();
    const isConsultorCal = (cd.segmento || "").toLowerCase().includes("consultoria") || (cd.cargo || "").toLowerCase().includes("consultor");
    const isDesqConsultor = isConsultorCal && fat.includes("até") && fat.includes("30 mil");
    const isDesqB2b = !isConsultorCal && fat.includes("até") && fat.includes("100 mil") && (func.includes("1-5") || func.includes("1 a 5"));
    if (pipedriveIdsRef.current.deal_id && !isDesqConsultor && !isDesqB2b) {
      supabase.functions.invoke("assign-pipedrive-owner", {
        body: { deal_id: pipedriveIdsRef.current.deal_id, flow: "sala" },
      }).catch(() => {});
    }

    // Send FINAL conversation note with full transcript (post-scheduling)
    if (pipedriveIdsRef.current.deal_id) {
      sendConversationNote(pipedriveIdsRef.current.deal_id, cd);
    }

    setShowCalendar(false);
    setShowConfirmation(true);
  };

  const handleRequestExecutiveFromCalendar = () => {
    setShowCalendar(false);
    handleRequestExecutive();
  };

  // Compute current step for progress bar
  const totalSteps = 6;
  const currentStep = (() => {
    if (showConfirmation || showVendedor) return 6;
    if (showCalendar) return 5;
    if (showDiagnostic) return 4;
    if (collectedData.faturamento) return 4;
    if (collectedData.empresa || showForm) return 3;
    if (collectedData.nome) return 2;
    return 1;
  })();

  // Vendedor confirmation screen
  if (showVendedor) {
    return (
      <div className="h-dvh bg-white flex flex-col overflow-hidden">
        <Chat2Header currentStep={currentStep} totalSteps={totalSteps} />
        <div className="flex-1 overflow-y-auto flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center space-y-6 animate-fade-in-up">
            {loadingExec ? (
              <p className="text-gray-500">Localizando seu executivo...</p>
            ) : matchedExec ? (
              <>
                <img src={matchedExec.foto} alt={matchedExec.nome} className="w-28 h-28 rounded-full object-cover object-top mx-auto border-4 border-[#D4A017]/20 shadow-lg" />
                <div>
                  <h2 className="text-xl font-bold text-[#0D1117]">{collectedData.nome}, seu executivo é</h2>
                  <p className="text-2xl font-bold text-[#D4A017] mt-1">{matchedExec.nome}</p>
                </div>
                <a href={`https://wa.me/${matchedExec.whatsapp}?text=${encodeURIComponent(`Olá ${matchedExec.nome.split(" ")[0]}, sou ${collectedData.nome} da ${collectedData.empresa}. Gostaria de saber mais sobre o Orbit!`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base shadow-md">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.462-1.494A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.724-6.022-1.95l-.422-.316-2.644.885.886-2.638-.346-.45A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  Fale agora com {matchedExec.nome.split(" ")[0]}
                </a>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#D4A017]/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">🤝</span>
                </div>
                <h2 className="text-xl font-bold text-[#0D1117]">{collectedData.nome}, seu contato foi registrado!</h2>
                <p className="text-gray-500 text-sm">Um dos nossos executivos comerciais vai entrar em contato com você em breve pelo WhatsApp.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (showConfirmation) {
    return (
      <div className="h-dvh bg-white flex flex-col overflow-hidden">
        <Chat2Header currentStep={currentStep} totalSteps={totalSteps} />
        <div className="flex-1 overflow-y-auto flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <ConfirmationScreen
              name={`${collectedData.nome} ${collectedData.sobrenome || ""}`.trim()}
              date={calendarData.date} time={calendarData.time}
              segmento={collectedData.segmento || ""}
              meetingLink={resolvedMeetLink}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <Chat2Header currentStep={currentStep} totalSteps={totalSteps} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === "user") return <UserBubble key={i} text={msg.content} />;
            if (msg.audioUrl) {
              return (
                <div key={i} className="space-y-2">
                  <AudioBubble
                    audioUrl={msg.audioUrl}
                    transcript={msg.content}
                    showTranscript={msg.showTranscript || false}
                    onToggleTranscript={() => {
                      setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, showTranscript: !m.showTranscript } : m));
                    }}
                  />
                  {msg.options && msg.options.length > 0 && (
                    <div className="pl-12 sm:pl-[52px] flex flex-wrap gap-2">
                      {msg.options.map((opt) => (
                        <button key={opt} onClick={() => handleOptionClick(opt, i)} disabled={isLoading}
                          className="bg-white border border-[#D4A017]/40 text-[#1a1a1a] px-4 py-2.5 rounded-xl text-base font-medium hover:bg-[#D4A017]/10 hover:border-[#D4A017] active:scale-[0.97] transition-all disabled:opacity-50">
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={i} className="space-y-2">
                <BotBubble text={msg.content} />
                {msg.ctaLink && (
                  <div className="pl-12 sm:pl-[52px]">
                    <a href={msg.ctaLink.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block bg-[#D4A017] text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-[#b8891a] active:scale-[0.97] transition-all">
                      {msg.ctaLink.label}
                    </a>
                  </div>
                )}
                {msg.options && msg.options.length > 0 && (
                  <div className="pl-12 sm:pl-[52px] flex flex-wrap gap-2">
                    {msg.options.map((opt) => (
                      <button key={opt} onClick={() => handleOptionClick(opt, i)} disabled={isLoading}
                        className="bg-white border border-[#D4A017]/40 text-[#1a1a1a] px-3 sm:px-4 py-2.5 rounded-xl text-base font-medium hover:bg-[#D4A017]/10 hover:border-[#D4A017] active:scale-[0.97] transition-all disabled:opacity-50">
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {isRecordingAudio && <RecordingIndicator />}
          {isLoading && !isRecordingAudio && <TypingDots />}

          {pendingOptions && !isLoading && !isRecordingAudio && (
            <div className="pl-12 sm:pl-[52px] animate-fade-in-up">
              <button
                onClick={() => {
                  // Add "Entendido" as user message then reveal options
                  const userMsg: ChatMessage = { role: "user", content: "✅ Entendido Olívia" };
                  setMessages(prev => [...prev, { role: "assistant", content: "", options: pendingOptions }]);
                  conversationRef.current.push({ role: "user", content: "Entendido, pode continuar." });
                  setPendingOptions(null);
                  scrollToBottom();
                }}
                className="bg-[#D4A017] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b8891a] active:scale-[0.97] transition-all"
              >
                ✅ Entendido Olívia
              </button>
            </div>
          )}

          {showForm && (
            <InlineLeadForm
              onSubmit={handleFormSubmit}
              isSubmitting={isLoading}
              leadName={collectedData.nome || ""}
              leadEmpresa={collectedData.empresa || ""}
            />
          )}

          {showCalendar && (
            <CalendarPicker
              onSelect={handleCalendarSelect}
              onRequestExecutive={handleRequestExecutiveFromCalendar}
              segmento={collectedData.segmento || ""}
              cargo={collectedData.cargo || ""}
              faturamento={collectedData.faturamento || ""}
            />
          )}

          {showDiagnostic && (
            <DiagnosticInlineFlow
              leadNome={`${collectedData.nome} ${collectedData.sobrenome || ""}`.trim()}
              leadEmail={collectedData.email || ""}
              leadCelular={collectedData.whatsapp || ""}
              leadEmpresa={collectedData.empresa || ""}
              leadId={leadIdRef.current || undefined}
              prefilledSetor={isConsultor ? "Consultoria" : (collectedData.segmento || undefined)}
              onComplete={() => {
                setShowDiagnostic(false);
                const fat = (collectedData.faturamento || "").toLowerCase();
                const isLowRev = fat.includes("até") && fat.includes("100 mil");
                if (isLowRev && !isConsultor) {
                  const msg: ChatMessage = { role: "assistant", content: `${collectedData.nome}, agora que você conhece seu nível de maturidade, vamos agendar sua demonstração em grupo?`, options: ["📅 Agendar demonstração em grupo"] };
                  setMessages(prev => [...prev, msg]);
                } else {
                  const msg: ChatMessage = { role: "assistant", content: `${collectedData.nome}, agora que você conhece seu nível de maturidade, como prefere seguir?`, options: ["📅 Demonstração em grupo", "👤 Falar com executivo comercial"] };
                  setMessages(prev => [...prev, msg]);
                }
              }}
            />
          )}
        </div>
      </div>

      {!showCalendar && !showDiagnostic && !showConfirmation && !showVendedor && !showForm && (
        <div className="border-t border-gray-200 shrink-0 bg-white safe-bottom">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center bg-[#F5F5F5] rounded-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 focus-within:border-[#D4A017] transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-[#1a1a1a] placeholder:text-gray-400 text-base"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-full bg-[#D4A017] text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:bg-gray-300 hover:bg-[#b8891a] active:scale-95"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Header component for chat2
function Chat2Header({ currentStep = 1, totalSteps = 6 }: { currentStep?: number; totalSteps?: number }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#D4A017] flex items-center justify-center">
          <span className="text-white font-bold text-sm">O</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#1a1a1a] text-lg leading-tight">Olívia</span>
          <span className="text-xs text-gray-500 leading-tight">Atendente Orbit</span>
        </div>
      </div>

      <div className="flex-1 mx-4 sm:mx-8 flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div
              className={`h-1 w-full rounded-full transition-colors duration-300 ${
                i < currentStep ? "bg-[#D4A017]" : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-3xl font-bold text-[#1a1a1a]">{currentStep}</span>
        <span className="text-gray-400 text-sm">de {totalSteps}</span>
      </div>
    </header>
  );
}

export default Chat2;
