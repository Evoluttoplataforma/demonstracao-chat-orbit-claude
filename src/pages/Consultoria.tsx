import { useState, useEffect, useMemo, useRef } from "react";
import { validateEmail } from "@/lib/email-validation";
import { pushFormSubmitSuccess } from "@/lib/dataLayer";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import { getConsultorSessionVariant } from "@/components/chat/consultorCopyVariants";
import oliviaImg from "@/assets/olivia-real-optimized.jpg";
import orbitLogoColor from "@/assets/orbit-logo-color.png";
import {
  CheckCircle, ChevronDown, Star, Shield, Award,
  Search, FolderCog, Rocket, ClipboardCheck, Quote,
  X, User, Mail, Phone, Building2, MessageSquare,
  BarChart3, Users, Zap, Brain, Target, Briefcase,
  GraduationCap, FileText, TrendingUp, Calendar,
  Instagram, MapPin, Repeat, DollarSign, Layers, Lock,
} from "lucide-react";

/* ── FAQ Data (Consultores) ── */
const faqItems = [
  { q: "O que é o Orbit Full White Label?", a: "O Orbit é uma plataforma de agentes de IA para gestão empresarial. No modelo Full White Label, você implanta o Orbit nos seus clientes com a sua marca, seu preço e sua operação — gerando receita recorrente passiva mensal." },
  { q: "Preciso ter conhecimento técnico em IA?", a: "Não. A Olívia, nossa especialista em IA, configura tudo. Você foca na venda e no relacionamento com o cliente. Os agentes executam automaticamente." },
  { q: "Quanto posso ganhar por cliente?", a: "O modelo permite cobrar de R$1.500 a R$5.000/mês por cliente, dependendo do porte. Com 10 clientes, você pode faturar R$25.000/mês em receita recorrente passiva." },
  { q: "E se meu cliente cancelar?", a: "Os agentes de IA se tornam parte da operação do cliente. A taxa de retenção é superior a 95% porque o cliente depende dos agentes para rodar a gestão no dia a dia." },
  { q: "A demonstração é gratuita?", a: "Sim. São 30 minutos para você entender o modelo de negócio, ver a plataforma funcionando e calcular seu potencial de receita. Sem compromisso." },
  { q: "Quantos clientes posso atender?", a: "Não há limite. Como os agentes de IA executam automaticamente, você escala sem precisar aumentar sua equipe. Consultores parceiros atendem de 5 a 50+ clientes." },
];

/* ── Pain Points (Consultores) ── */
const painPoints = [
  { bold: "Cada mês começo do zero", sub: "buscando novos projetos para fechar." },
  { bold: "Entrego o projeto e perco o cliente.", sub: "Sem recorrência, sem previsibilidade." },
  { bold: "Para crescer, preciso contratar mais gente", sub: "— e o custo come o lucro." },
  { bold: "Meus clientes não implementam o que eu entrego.", sub: "O resultado fica no papel." },
  { bold: "Dependo 100% da minha presença", sub: "para gerar valor. Não escala." },
  { bold: "Concorrentes estão oferecendo IA", sub: "e eu vou ficar para trás." },
];

/* ── AI Agents (same as main) ── */
const agents = [
  { icon: Target, name: "Ag. Estrategista", desc: "Constrói planejamento estratégico, SWOT, BSC, objetivos e planos de ação" },
  { icon: FolderCog, name: "Ag. de Processos", desc: "Mapeia processos, gera instruções de trabalho, playbooks e padrões" },
  { icon: Users, name: "Ag. de Pessoas", desc: "Descreve cargos, analisa desempenho, cria PDIs e acompanha evolução" },
  { icon: GraduationCap, name: "Ag. de Treinamento", desc: "Cria microlearning diário, distribui via WhatsApp com quizzes e provas" },
  { icon: BarChart3, name: "Ag. de Indicadores", desc: "Monitora KPIs, gera hipóteses de causa raiz, sugere ações corretivas" },
  { icon: Search, name: "Ag. de Pesquisa", desc: "Analisa formulários, pesquisas de clima, avaliações, gera insights" },
  { icon: Briefcase, name: "Ag. de Oportunidades", desc: "Mapeia oportunidades de mercado, portfólio e parcerias" },
  { icon: ClipboardCheck, name: "Ag. de Problemas", desc: "Registra não conformidades, causa raiz, planos de ação corretivos" },
  { icon: FileText, name: "Ag. de Documentos", desc: "Gera documentos corporativos estruturados conectados aos processos" },
  { icon: TrendingUp, name: "Ag. de Vendas", desc: "Estrutura funil, cadências de follow-up, análise de pipeline" },
  { icon: Calendar, name: "Ag. de Reuniões", desc: "Gera pautas, registra decisões, distribui ações pós-reunião" },
  { icon: Brain, name: "Ag. de Riscos", desc: "Mapeia riscos estratégicos e de processos, propõe mitigações" },
];

/* ── White Label Benefits ── */
const whitelabelBenefits = [
  { icon: Layers, title: "Sua Marca", desc: "A plataforma roda com a identidade visual da sua consultoria. Seu cliente vê a sua marca, não a nossa." },
  { icon: DollarSign, title: "Seu Preço", desc: "Você define quanto cobra. Margem livre para posicionar como quiser no mercado." },
  { icon: Repeat, title: "Receita Recorrente Passiva", desc: "Sai do modelo projeto e entra na recorrência passiva. Seus clientes pagam mensalidade para ter os agentes rodando — sem depender da sua presença." },
  { icon: Lock, title: "Operação Independente", desc: "Você não precisa estar no cliente. Os agentes de IA executam 24/7 — a operação continua rodando." },
];

/* ── Process Steps ── */
const processSteps = [
  { icon: Zap, number: "01", title: "Conheça o modelo", desc: "Entenda como funciona o Full White Label, a plataforma e o potencial de receita passiva para sua consultoria." },
  { icon: Brain, number: "02", title: "Configure sua operação", desc: "Personalize a plataforma com sua marca. A Olívia configura os agentes para o contexto dos seus clientes." },
  { icon: Rocket, number: "03", title: "Venda e escale", desc: "Implante nos seus clientes e comece a cobrar recorrência passiva. Sem limite de clientes, sem aumentar equipe." },
];

/* ── Results ── */
const results = [
  { value: "Dezenas", label: "Agentes de IA", desc: "Prontos para implantar nos seus clientes desde o dia 1" },
  { value: "R$25k", label: "Receita passiva/mês", desc: "Potencial com apenas 10 clientes ativos na base" },
  { value: "95%", label: "Retenção", desc: "Clientes permanecem porque dependem dos agentes no dia a dia" },
  { value: "0", label: "Contratações", desc: "Escale sem aumentar equipe — os agentes fazem o trabalho" },
];

/* ── FormInput ── */
const FormInput = ({
  label, icon: Icon, name, value, onChange, type = "text", autoComplete,
}: {
  label: string; icon: any; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; autoComplete?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const inputName = autoComplete === "off" ? `${name}_${Math.random().toString(36).slice(2, 6)}` : name;

  return (
    <div className={`relative rounded-2xl transition-all duration-300 bg-card border-2 ${
      focused ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : "border-border hover:border-primary/40"
    }`}>
      <label className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
        focused || hasValue ? "top-2 text-xs font-medium text-primary" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
      }`}>{label}</label>
      <div className="flex items-center">
        <input
          type={type} name={inputName} value={value}
          onChange={(e) => {
            const syntheticEvent = { ...e, target: { ...e.target, name, value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }}
          autoComplete={autoComplete || "off"}
          autoCorrect="off"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full px-4 pt-6 pb-3 bg-transparent outline-none text-foreground text-base font-medium pr-12 placeholder:text-transparent"
        />
        <div className={`absolute right-4 transition-all duration-300 ${focused ? "text-primary scale-110" : "text-muted-foreground"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

/* ── FAQ Section ── */
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {faqItems.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
            <span className="text-sm font-medium text-foreground/90">{item.q}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`} />
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main Consultoria Landing Page ── */
const Consultoria = () => {
  const navigate = useNavigate();
  const pageStartRef = useRef(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "" });
  const [phoneFullNumber, setPhoneFullNumber] = useState("+55");
  const [consentido, setConsentido] = useState(false);
  const variant = useMemo(() => getConsultorSessionVariant(), []);

  const isValid = formData.name && formData.email && formData.phone && formData.company && consentido;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    const emailCheck = validateEmail(formData.email.trim());
    if (!emailCheck.valid) {
      setEmailError(emailCheck.error || "E-mail inválido");
      return;
    }
    setEmailError("");
    setSubmitting(true);

    const parts = formData.name.trim().split(" ");
    const nome = parts[0];
    const sobrenome = parts.slice(1).join(" ");
    const copyVariant = variant.id;

    const params = new URLSearchParams(window.location.search);
    const utmFields = {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_content: params.get('utm_content') || undefined,
      utm_term: params.get('utm_term') || undefined,
      gclid: params.get('gclid') || undefined,
      fbclid: params.get('fbclid') || undefined,
      gbraid: params.get('gbraid') || undefined,
      wbraid: params.get('wbraid') || undefined,
      ttclid: params.get('ttclid') || undefined,
      gad_campaignid: params.get('gad_campaignid') || undefined,
      gad_source: params.get('gad_source') || undefined,
      msclkid: params.get('msclkid') || undefined,
      li_fat_id: params.get('li_fat_id') || undefined,
      sck: params.get('sck') || undefined,
      landing_page: window.location.href,
      origin_page: window.location.pathname,
      session_attributes_encoded: params.get('session_attributes_encoded') || undefined,
      apex_session_id: sessionStorage.getItem('apex_session_id') || undefined,
    };
    const cleanUtm = Object.fromEntries(Object.entries(utmFields).filter(([, v]) => v !== undefined));

    try {
      const phoneDigitsForLookup = formData.phone.replace(/\D/g, '');

      const { data: existingLead, error: lookupError } = await supabase.from("leads")
        .select("id")
        .or(`email.eq.${formData.email},whatsapp.ilike.%${phoneDigitsForLookup}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lookupError) console.error("LP Consultor: Lookup error:", lookupError);

      let leadId: string | null = null;
      const resolvedCopyVariant = copyVariant || variant?.id || "CA";
      const leadPayload = {
        nome,
        sobrenome,
        whatsapp: phoneFullNumber,
        email: formData.email,
        empresa: formData.company,
        status: "parcial",
        copy_variant: resolvedCopyVariant,
        cargo: "Consultor",
        oque_faz: "Consultoria",
        ...cleanUtm,
      } as any;

      if (existingLead) {
        const { error: updateError } = await supabase.from("leads")
          .update(leadPayload)
          .eq("id", existingLead.id);
        if (updateError) console.error("LP Consultor: Erro ao atualizar lead:", updateError);
        leadId = existingLead.id;
      } else {
        const { data: inserted, error: insertError } = await supabase.from("leads")
          .insert(leadPayload)
          .select("id").single();
        if (insertError) console.error("LP Consultor: Erro ao inserir lead:", insertError);
        leadId = inserted?.id || null;
      }

      supabase.functions.invoke('sync-lead-crm', {
        body: { nome: formData.name, email: formData.email, whatsapp: formData.phone, empresa: formData.company || '' },
      }).then(({ error }) => {
        if (error) console.warn('CRM sync failed:', error);
      });

      try {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        let sid = sessionStorage.getItem('apex_session_id');
        if (!sid) {
          sid = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('apex_session_id', sid);
        }
        pushFormSubmitSuccess({
          email: formData.email,
          phoneNumber: phoneDigits.replace(/^55/, ''),
          nome,
          sobrenome,
          apex_session_id: sid,
          time_on_page_at_submit: Math.round((Date.now() - pageStartRef.current) / 1000),
        });
      } catch (e) {
        console.error('dataLayer push error:', e);
      }

      // Fire-and-forget: Pipedrive creation runs in background
      supabase.functions.invoke('create-pipedrive-lead', {
        body: {
          action: 'create',
          name: formData.name.trim(),
          whatsapp: phoneFullNumber,
          email: formData.email,
          empresa: formData.company,
          cargo: "Consultor",
          oqueFaz: "Consultoria",
          leadId,
          copyVariant,
          utmData: cleanUtm,
        },
      }).then(({ data: pipeResult, error: pipeError }) => {
        if (!pipeError && pipeResult?.success) {
          console.log("LP Consultor: Pipedrive lead criado (background):", pipeResult.deal_id);
          supabase.functions.invoke("create-pipedrive-lead", { body: { action: "add_label", deal_id: pipeResult.deal_id, label_name: "CHAT1", label_color: "blue" } }).catch(() => {});
        }
      }).catch((e) => console.error("LP Consultor: Pipedrive exception (background):", e));

      sessionStorage.setItem("orbit_lp_data", JSON.stringify({
        ...formData,
        nome,
        sobrenome,
        copyVariant,
        leadId,
        pipedriveIds: {},
        utmData: cleanUtm,
        oqueFaz: "Consultoria",
        cargo: "Consultor",
        nicheSetor: "Consultoria",
      }));

      navigate("/chat");
    } catch (err) {
      console.error("Failed to save lead from LP Consultor:", err);
      sessionStorage.setItem("orbit_lp_data", JSON.stringify({ ...formData, copyVariant }));
      navigate("/chat");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const container = document.getElementById("lp-scroll");
    if (!container) return;
    const handler = () => setShowStickyBar(container.scrollTop > 400);
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, []);

  return (
    <div id="lp-scroll" className="h-dvh flex flex-col bg-background text-foreground overflow-y-auto animate-fade-in">

      {/* Sticky CTA Bar */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${showStickyBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <div className="bg-background/95 backdrop-blur-md border-b border-border px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={orbitLogoColor} alt="Orbit" className="h-7 w-auto" />
              <span className="font-bold text-foreground text-sm">Orbit</span>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm px-5 py-2 rounded-lg transition-colors whitespace-nowrap">
              {variant.cta}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <X className="w-4 h-4 text-foreground" />
            </button>
            <h3 className="text-lg font-bold text-primary text-center mb-1">Preencha para iniciar:</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">100% gratuito • Sem compromisso</p>
            <div id="lead-form" className="space-y-4 mb-6">
              <FormInput name="name" value={formData.name} onChange={handleChange} label="Nome Completo *" icon={User} autoComplete="name" />
              <div>
                <FormInput type="email" name="email" value={formData.email} onChange={(e) => { handleChange(e); if (emailError) setEmailError(""); }} label="Email *" icon={Mail} autoComplete="email" />
                {emailError && <p className="text-destructive text-sm mt-1 px-1">{emailError}</p>}
              </div>
              <PhoneInputWithCountry
                variant="card"
                onValueChange={(full, raw) => {
                  setPhoneFullNumber(full);
                  setFormData((prev) => ({ ...prev, phone: raw }));
                }}
              />
              <FormInput name="company" value={formData.company} onChange={handleChange} label="Nome da Consultoria *" icon={Building2} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer group mb-4">
              <div className="pt-0.5">
                <div
                  onClick={() => setConsentido(!consentido)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    consentido ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary/60"
                  }`}
                >
                  {consentido && (
                    <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                Ao preencher este formulário, concordo em compartilhar meus dados com a Orbit para fins de contato e demonstração, conforme a{" "}
                <a href="/privacidade" target="_blank" className="text-primary underline hover:text-primary/80">Política de Privacidade</a>.
              </span>
            </label>
            <button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full py-4 px-8 rounded-xl font-extrabold text-lg tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/30">
              <MessageSquare className="w-5 h-5" />
              {submitting ? "ENVIANDO..." : "INICIAR CONVERSA"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative px-5 pt-6 pb-6 flex flex-col items-start text-left lg:px-16 lg:pt-20 lg:pb-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <img src={orbitLogoColor} alt="Orbit" className="h-10 w-auto" />
            <span className="font-bold text-foreground text-2xl">Orbit</span>
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-5 border border-primary/25 relative z-10 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 shrink-0" />
                Dezenas de agentes de IA prontos para implantar nos seus clientes
              </span>

              <h1 className="text-[1.75rem] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12] font-extrabold leading-[1.15] mb-4 relative z-10 uppercase tracking-tight">
                {variant.headline}{" "}
                <span className="text-primary">{variant.highlightedPart}</span>
              </h1>

              <p className="text-[0.95rem] lg:text-lg text-foreground/80 mb-6 relative z-10 leading-relaxed">
                {variant.description}
              </p>

              <div className="w-full max-w-sm relative z-10 mb-3">
                <button onClick={() => setShowModal(true)} className="w-full py-5 px-8 rounded-xl font-extrabold text-lg tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/30">
                  {variant.cta}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-2.5">⏱️ 2 min • 100% gratuito • Sem compromisso</p>
              </div>

              <ChevronDown className="w-5 h-5 text-muted-foreground/40 animate-bounce mt-2 hidden lg:block" />
            </div>

            {/* Right side — desktop only: Revenue Calculator */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-6 relative z-10">
              <div className="w-full max-w-md space-y-4">
                <div className="bg-card/50 border border-border rounded-2xl p-6 backdrop-blur-sm">
                  <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/25 uppercase tracking-wider mb-4">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    Simulação de Receita
                  </span>
                  <div className="space-y-4 mt-2">
                    {[
                      { clients: "5 clientes", revenue: "R$12.500/mês", pct: 30 },
                      { clients: "10 clientes", revenue: "R$25.000/mês", pct: 55 },
                      { clients: "20 clientes", revenue: "R$50.000/mês", pct: 80 },
                      { clients: "50 clientes", revenue: "R$125.000/mês", pct: 100 },
                    ].map((item) => (
                      <div key={item.clients}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{item.clients}</span>
                          <span className="text-primary font-bold">{item.revenue}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center italic">
                    * Baseado em ticket médio de R$2.500/cliente/mês
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "Dezenas", label: "Agentes de IA" },
                    { val: "95%", label: "Retenção" },
                    { val: "100%", label: "Full White Label" },
                  ].map((s) => (
                    <div key={s.label} className="bg-card/50 border border-border rounded-xl p-3 text-center">
                      <div className="text-xl font-extrabold text-primary">{s.val}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ChevronDown className="w-5 h-5 text-muted-foreground/40 animate-bounce mt-2 lg:hidden" />
        </div>
      </section>

      {/* ═══ OLÍVIA SECTION ═══ */}
      <section className="px-5 py-8 lg:py-12 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-[20px] border border-primary/30 bg-card p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <img src={oliviaImg} loading="lazy" alt="Olívia — Especialista em IA do Orbit" className="w-16 h-16 rounded-full object-cover object-[center_20%] shrink-0 border-2 border-primary" />
              <div>
                <p className="font-bold text-primary text-lg">Olívia</p>
                <p className="text-sm text-muted-foreground">Especialista em IA do Orbit</p>
              </div>
            </div>
            <p className="mt-5 text-foreground/90 italic text-base lg:text-lg leading-relaxed">
              "Eu coordeno dezenas de agentes de IA dentro do Orbit. Quando você implanta nos seus clientes, eu cuido de tudo: configuro os agentes, monitoro resultados e garanto que a operação do cliente rode sem precisar da sua presença. Você vende, eu executo."
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Veja se você se reconhece nos desafios abaixo:
          </p>
          <div className="flex justify-center mt-3">
            <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section className="bg-secondary/50">
        <div className="max-w-6xl mx-auto px-5 py-8 lg:py-14 lg:px-16">
          <div className="text-center mb-8">
            <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
              O dilema de todo <span className="text-primary">consultor:</span>
            </h2>
            <p className="text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto">
              Você entrega um ótimo projeto, mas quando sai de cena, tudo volta ao que era. O cliente não implementa, você perde a recorrência e precisa buscar novos projetos todo mês.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {painPoints.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{item.bold}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-8 py-3 rounded-xl transition-colors uppercase tracking-wide shadow-lg shadow-primary/20">
              QUERO SAIR DESSE CICLO →
            </button>
          </div>
        </div>
      </section>

      {/* ═══ WHITE LABEL BENEFITS ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
              Orbit Full White Label:{" "}
              <span className="text-primary">sua marca, sua operação</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Implante um time completo de agentes de IA nos seus clientes — com a identidade da sua consultoria. Seu cliente vê a sua marca, não a nossa.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {whitelabelBenefits.map((b, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-primary mb-2">{b.title}</h3>
                <p className="text-xs text-foreground/80 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 12 AGENTS GRID ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
              O time de IA que você{" "}
              <span className="text-primary">entrega aos seus clientes</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Cada agente é especialista em uma área da gestão. Eles trabalham 24/7 dentro da operação do seu cliente — e você cobra recorrência passiva por isso.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {agents.map((a, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <a.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-primary">{a.name}</h3>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Revenue anchoring for consultants */}
          <div className="mt-8 rounded-[20px] border border-primary/30 bg-card p-6 lg:p-8 text-center">
            <p className="text-base lg:text-lg text-foreground/90 leading-relaxed">
              Se seu cliente contratasse esse time como CLT, gastaria entre{" "}
              <span className="text-destructive line-through font-bold">R$100.000 e R$200.000/mês</span>.{" "}
              Você entrega tudo isso com o Orbit e cobra a partir de{" "}
              <span className="text-success font-extrabold text-xl lg:text-2xl">R$2.500/mês</span>{" "}
              — com margem para você.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ RESULTS ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
              Números do modelo{" "}
              <span className="text-primary">Orbit para Consultores</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {results.map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary/30 transition-all duration-300">
                <div className="text-3xl lg:text-4xl font-extrabold text-primary mb-1">{r.value}</div>
                <p className="text-sm font-semibold text-foreground mb-2">{r.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
              Como funciona?{" "}
              <span className="text-primary">3 passos para começar</span>
            </h2>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block relative">
            <div className="absolute top-[80px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-full" />
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              {processSteps.map((step, i) => (
                <div key={i} className="relative group">
                  <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-center hover:-translate-y-1">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative">
                      <step.icon className="w-7 h-7 text-primary" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">{i + 1}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden max-w-sm mx-auto">
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/50 rounded-full" />
              <div className="space-y-4">
                {processSteps.map((step, i) => (
                  <div key={i} className="relative flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center z-10 relative">
                      <step.icon className="w-5 h-5 text-primary" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    </div>
                    <div className="flex-1 bg-card rounded-xl p-3 border border-border">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Passo {step.number}</span>
                      <h3 className="text-base font-bold text-foreground mt-1.5 mb-0.5">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16">
        <div className="max-w-sm lg:max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-3 lg:gap-8 text-center mb-5 lg:mb-10">
            <div>
              <div className="text-2xl lg:text-4xl font-extrabold text-primary">Dezenas</div>
              <div className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wider mt-1">Agentes de IA</div>
            </div>
            <div>
              <div className="text-2xl lg:text-4xl font-extrabold text-primary">2.206+</div>
              <div className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wider mt-1">Empresas atendidas</div>
            </div>
            <div>
              <div className="text-2xl lg:text-4xl font-extrabold text-primary flex items-center justify-center gap-0.5">
                4,9 <Star className="w-4 h-4 lg:w-6 lg:h-6 fill-primary" />
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wider mt-1">Google</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 lg:p-5 rounded-xl bg-primary/10 border border-primary/25">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-base text-primary">Suporte Dedicado ao Consultor</p>
              <p className="text-sm text-muted-foreground">Canal exclusivo para consultores com onboarding, treinamento e suporte técnico prioritário.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-2">
              O que consultores dizem{" "}
              <span className="text-primary">sobre o Orbit</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-3xl mx-auto">
            {[
              { name: "Rogério Menossi", company: "CEO — Time Produtivo", text: "Em dois meses usando Orbit aumentamos em 25% nossa receita recorrente.", initial: "R" },
              { name: "Pedro Muchitz", company: "Weagle", text: "Com o Orbit estamos conseguindo padronizar a gestão em unidades no Brasil, EUA e Japão.", initial: "P" },
            ].map((t, i) => (
              <div key={i} className="relative bg-card rounded-xl p-5 lg:p-6 border border-border hover:border-primary/20 transition-all duration-300">
                <div className="absolute -top-2 right-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">{t.initial}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-5 py-8 lg:py-14 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl lg:text-2xl font-extrabold text-foreground uppercase tracking-tight text-center mb-6">
            Perguntas <span className="text-primary">Frequentes</span>
          </h2>
          <FAQSection />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-5 py-8 lg:py-16 lg:px-16 bg-secondary/50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl lg:text-3xl font-extrabold text-foreground uppercase tracking-tight mb-3">
            Pronto para transformar sua consultoria em{" "}
            <span className="text-primary">operação recorrente?</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Agende uma demonstração gratuita de 30 minutos. Descubra como o Orbit Full White Label pode gerar receita recorrente passiva para sua consultoria — sem aumentar equipe.
          </p>
          <button onClick={() => setShowModal(true)} className="w-full max-w-sm mx-auto py-5 px-8 rounded-xl font-extrabold text-lg tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/30">
            {variant.cta}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-2.5">⏱️ 2 min • 100% gratuito • Sem compromisso</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-card border-t border-border text-foreground py-10 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-10 md:mb-12">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <img src={orbitLogoColor} alt="Orbit" className="h-8 sm:h-10 w-auto" />
                <span className="font-bold text-lg sm:text-xl">Orbit</span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                Time de agentes de IA para gestão empresarial. Modelo Full White Label para consultorias que querem escalar com recorrência passiva.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <a href="https://www.instagram.com/orbitgestao" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Contato</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-center gap-2 sm:gap-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <a href="https://wa.me/5548991206282?text=Ol%C3%A1!%20Quero%20conhecer%20o%20Orbit%20para%20Consultores" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base">
                    (48) 99120-6282
                  </a>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm sm:text-base">
                    Square SC - Rod. José Carlos Daux, 5500<br />
                    Saco Grande, Florianópolis - SC, 88032-005
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground/50 text-center sm:text-left">
              © {new Date().getFullYear()} Orbit. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <a href="/privacidade" className="text-xs sm:text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                Política de Privacidade
              </a>
              <a href="/termos" className="text-xs sm:text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Consultoria;
