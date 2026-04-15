import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PresentationShell from "@/components/apresentacao/PresentationShell";
import FadeIn from "@/components/apresentacao/FadeIn";
import OliviaBubble from "@/components/apresentacao/OliviaBubble";
import AnimatedCounter from "@/components/apresentacao/AnimatedCounter";
import AgentOrbit from "@/components/apresentacao/AgentOrbit";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, CheckCircle, Users, Sparkles } from "lucide-react";

/* ─── Color constants ─── */
const C = {
  dark: "#0D1117",
  dark2: "#161B22",
  dark3: "#1C2333",
  gold: "#D4A017",
  goldLight: "#F5C518",
  green: "#22C55E",
  red: "#EF4444",
  white: "#FFFFFF",
  gray: "#8B949E",
  light: "#C9D1D9",
};

/* ─── Slide wrapper ─── */
const Slide = ({ children, bg = C.dark, className = "" }: { children: React.ReactNode; bg?: string; className?: string }) => (
  <div className={`h-full w-full overflow-y-auto flex flex-col ${className}`} style={{ background: bg }}>
    {children}
  </div>
);

/* ─── Tela 1: Abertura ─── */
const Slide01 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 relative">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-[120px] opacity-10" style={{ background: C.gold }} />
      <div className="absolute bottom-32 right-16 w-56 h-56 rounded-full blur-[100px] opacity-8" style={{ background: C.red }} />
    </div>
    <FadeIn active={active} delay={0}>
      <div className="flex items-center gap-4 mb-12">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: C.gold }}>
          <span className="text-2xl font-extrabold" style={{ color: C.dark }}>O</span>
        </div>
        <span className="text-4xl font-extrabold tracking-tight" style={{ color: C.white }}>Orbit</span>
      </div>
    </FadeIn>
    <FadeIn active={active} delay={400}>
      <OliviaBubble text="Oi! Eu sou a Olívia, especialista em IA e Gestão do Orbit. Nos próximos minutos, vou te mostrar como empresas estão usando inteligência artificial para fazer mais — com o time que já tem." position="center" />
    </FadeIn>
  </Slide>
);

/* ─── Tela 2: O Gap ─── */
const Slide02 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-6xl font-extrabold text-center mb-2" style={{ color: C.white }}>
        A IA já pode fazer quase tudo.
      </h1>
    </FadeIn>
    <FadeIn active={active} delay={200}>
      <p className="text-xl lg:text-2xl text-center mb-10" style={{ color: C.gray }}>
        Quase ninguém está usando de verdade.
      </p>
    </FadeIn>
    <FadeIn active={active} delay={400}>
      <div className="flex flex-col lg:flex-row gap-6 max-w-4xl w-full mb-8">
        <div className="flex-1 rounded-xl p-8 text-center" style={{ background: C.dark3 }}>
          <AnimatedCounter value={94} suffix="%" active={active} className="text-7xl font-extrabold block mb-3" style={{ color: C.gold }} />
          <p className="text-base" style={{ color: C.light }}>das tarefas de gestão podem ser aceleradas por IA</p>
        </div>
        <div className="flex-1 rounded-xl p-8 text-center" style={{ background: C.dark3 }}>
          <AnimatedCounter value={33} suffix="%" active={active} className="text-7xl font-extrabold block mb-3" style={{ color: C.red }} />
          <p className="text-base" style={{ color: C.light }}>das empresas estão usando na prática</p>
        </div>
      </div>
    </FadeIn>
    <FadeIn active={active} delay={600}>
      <p className="text-xs italic text-center mb-6" style={{ color: C.gray }}>Fonte: Anthropic, "Labor Market Impacts of AI", março 2026</p>
    </FadeIn>
    <FadeIn active={active} delay={800}>
      <div className="max-w-4xl w-full rounded-lg p-5" style={{ background: C.dark2, borderLeft: `4px solid ${C.gold}` }}>
        <p className="text-sm leading-relaxed" style={{ color: C.light }}>
          Em fevereiro de 2026, IA coordenou 900 alvos militares em 12 horas no Irã — um ritmo que levaria semanas sem ela. Se a inteligência artificial consegue operar com essa precisão no cenário mais complexo do mundo, por que ela não conseguiria executar o trabalho do dia a dia junto com o seu time?
        </p>
      </div>
    </FadeIn>
  </Slide>
);

/* ─── Tela 3: A Nova Escala ─── */
const Slide03 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-6xl font-extrabold text-center mb-2" style={{ color: C.white }}>O jogo mudou.</h1>
    </FadeIn>
    <FadeIn active={active} delay={200}>
      <p className="text-xl text-center mb-12" style={{ color: C.gray }}>O tamanho da equipe não é mais vantagem.</p>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl w-full">
      {[
        { border: C.gold, title: "5-10 pessoas", desc: "Pequenas equipes já faturam milhões. 1 profissional com IA produz como 5 a 10. Mais inteligência, menos estrutura, mais resultado." },
        { border: C.goldLight, title: "Empresa exponencial", desc: "Empresas estão triplicando receita sem aumentar equipe. O diferencial não é mais tamanho — é inteligência operacional." },
        { border: C.green, title: "IA + Dados + Processos", desc: "A combinação que gera mais receita com a mesma base. Não é sobre demitir gente. É sobre cada pessoa entregar 10x mais." },
      ].map((card, i) => (
        <FadeIn key={i} active={active} delay={400 + i * 150}>
          <div className="rounded-xl p-7 h-full" style={{ background: C.dark3, borderTop: `3px solid ${card.border}` }}>
            <h3 className="text-xl font-bold mb-3" style={{ color: C.white }}>{card.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{card.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  </Slide>
);

/* ─── Tela 4: 3 Estágios ─── */
const Slide04 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-12" style={{ color: C.white }}>Em qual estágio sua empresa está?</h1>
    </FadeIn>
    <div className="flex flex-col gap-5 max-w-3xl w-full mb-8">
      {[
        { num: "1", title: "Consultas", desc: "Sua equipe usa IA para tirar dúvidas e gerar textos. Útil, mas pontual. Não muda a operação.", color: C.gray },
        { num: "2", title: "Assistentes", desc: "IA integrada ao dia a dia: resumos automáticos, análises rápidas, sugestões em reuniões. Produtividade multiplicada.", color: C.gold },
        { num: "3", title: "Agentes Operacionais", desc: "IA operando processos inteiros: planejamento, indicadores, treinamento, vendas. A gestão funciona com mais inteligência e menos esforço manual.", color: C.green },
      ].map((s, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 200}>
          <div className="flex items-start gap-5 p-5 rounded-xl" style={{ background: C.dark3 }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-extrabold" style={{ background: s.color, color: C.dark }}>
              {s.num}
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: C.white }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.light }}>{s.desc}</p>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={900}>
      <div className="max-w-3xl w-full rounded-lg px-6 py-3 text-center font-bold text-sm" style={{ background: C.gold, color: C.dark }}>
        A maioria está no Estágio 1. O Orbit leva sua empresa direto ao Estágio 3.
      </div>
    </FadeIn>
    <FadeIn active={active} delay={1100}>
      <div className="mt-6">
        <OliviaBubble text="Agora que você sabe onde está, deixa eu te mostrar quem está por trás disso." position="center" />
      </div>
    </FadeIn>
  </Slide>
);

/* ─── Tela 5: Quem Somos ─── */
const Slide05 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-2" style={{ color: C.white }}>30 anos de gestão. Agora com IA.</h1>
    </FadeIn>
    <FadeIn active={active} delay={200}>
      <p className="text-lg text-center mb-10 max-w-3xl" style={{ color: C.gray }}>O Orbit nasceu dentro do maior grupo de consultoria em gestão e ISO do Brasil.</p>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl w-full mb-10">
      {[
        { border: C.gold, title: "Desde 1994 | Templum Consultoria", desc: "Líder em ISO no Brasil. +8.000 empresas atendidas. 30 anos transformando gestão em resultados." },
        { border: C.goldLight, title: "10 anos | Digitalização", desc: "Pioneiros em digitalizar consultorias. Escalamos conhecimento para milhares de empresas em todo o Brasil." },
        { border: C.green, title: "2026 | Nasce o Orbit", desc: "Sede em Florianópolis, escritórios em Campinas e Portugal. Plataforma de gestão com agentes de IA." },
      ].map((card, i) => (
        <FadeIn key={i} active={active} delay={400 + i * 150}>
          <div className="rounded-xl p-7 h-full" style={{ background: C.dark3, borderTop: `3px solid ${card.border}` }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: C.white }}>{card.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{card.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={900}>
      <p className="text-lg font-bold text-center max-w-3xl" style={{ color: C.white }}>
        Não somos uma startup. Somos 30 anos de gestão que evoluíram para a era da IA.
      </p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 6: O Problema Real ─── */
const Slide06 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-24">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-6xl font-extrabold text-center leading-tight mb-6" style={{ color: C.white }}>
        Em 2026, empresas não vão quebrar por falta de vendas.
      </h1>
    </FadeIn>
    <FadeIn active={active} delay={400}>
      <h2 className="text-3xl lg:text-5xl font-extrabold text-center mb-8" style={{ color: C.red }}>
        Vão quebrar por falta de RESULTADO.
      </h2>
    </FadeIn>
    <FadeIn active={active} delay={700}>
      <p className="text-lg text-center max-w-3xl leading-relaxed" style={{ color: C.light }}>
        Quando o time não tem processos claros, indicadores visíveis e planejamento vivo, cada decisão é um tiro no escuro. O resultado não vem — e ninguém sabe explicar por quê.
      </p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 7: Agentes de IA ─── */
const Slide07 = ({ active }: { active: boolean }) => (
  <Slide className="items-center overflow-hidden">
    {/* Top: welcome message */}
    <div className="w-full flex flex-col items-center justify-center pt-6 pb-2 px-8">
      <FadeIn active={active} delay={0}>
        <h2 className="text-3xl lg:text-5xl font-extrabold leading-tight mb-2" style={{ color: C.gold }}>
          Bem-vindos
        </h2>
      </FadeIn>
      <FadeIn active={active} delay={200}>
        <p className="text-xl lg:text-2xl leading-relaxed text-center font-semibold" style={{ color: C.light }}>
          Esta reunião será em grupo. Começaremos pontualmente em <span className="font-extrabold" style={{ color: C.gold }}>05 minutos</span>.
        </p>
        <p className="text-xl lg:text-2xl leading-relaxed text-center font-semibold mt-2" style={{ color: C.light }}>
          Por gentileza, mantenha seu <span className="font-extrabold" style={{ color: C.gold }}>microfone desligado</span>.
        </p>
      </FadeIn>
    </div>

    {/* Bottom: orbit */}
    <div className="flex-1 w-full flex flex-col items-center justify-center px-4">
      <AgentOrbit active={active} />
      <FadeIn active={active} delay={600}>
        <div className="mt-1 px-4 py-1.5 rounded-lg text-center" style={{ background: "rgba(212,160,23,0.2)" }}>
          <p className="text-xs font-bold" style={{ color: C.white }}>
            Esse time custa R$100-200k/mês. O Orbit entrega todos por uma fração.
          </p>
        </div>
      </FadeIn>
    </div>
  </Slide>
);

/* ─── Tela 8: Consultoria Recorrente Passiva ─── */
const Slide08 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-10" style={{ color: C.white }}>Consultoria que não para quando o projeto acaba</h1>
    </FadeIn>
    <FadeIn active={active} delay={300}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full mb-8">
        <div className="rounded-xl p-7" style={{ background: C.dark3, borderTop: `3px solid ${C.gray}` }}>
          <h3 className="text-lg font-bold mb-3" style={{ color: C.white }}>CONSULTORIA</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.light }}>Consultor entra → Diagnostica → Entrega relatório → Vai embora</p>
        </div>
        <div className="rounded-xl p-7" style={{ background: C.dark3, borderTop: `3px solid ${C.goldLight}` }}>
          <h3 className="text-lg font-bold mb-3" style={{ color: C.white }}>SOFTWARE</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.light }}>Contrata → Faz implantação → Precisa parametrizar → Configurar → Incluir dados → Meses pra funcionar</p>
        </div>
        <div className="rounded-xl p-7" style={{ background: C.dark3, borderTop: `3px solid ${C.green}` }}>
          <h3 className="text-lg font-bold mb-3" style={{ color: C.white }}>MODELO ORBIT</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.light }}>Agentes configurados → Operam todos os dias → Monitoram, treinam, ajustam → Nunca param</p>
        </div>
      </div>
    </FadeIn>
    <FadeIn active={active} delay={500}>
      <div className="px-5 py-2 rounded-full text-sm font-bold mb-6" style={{ background: C.gold, color: C.dark }}>
        Consultoria Recorrente Passiva
      </div>
    </FadeIn>
    <FadeIn active={active} delay={700}>
      <p className="text-lg text-center max-w-3xl mb-6 leading-relaxed" style={{ color: C.white }}>
        É como ter um time de gestão que nunca sai. Uma consultoria que trabalha 24h, 7 dias por semana, dentro da sua empresa.
      </p>
    </FadeIn>
    <FadeIn active={active} delay={900}>
      <OliviaBubble text="Eu sou a prova viva disso. Estou aqui agora te ajudando, e estarei lá dentro da sua empresa fazendo o mesmo com sua equipe." position="center" />
    </FadeIn>
  </Slide>
);

/* ─── Tela 9: Diagnóstico ─── */
const Slide09 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <div className="mb-6">
        <OliviaBubble text="Quer saber exatamente onde sua empresa está? Em menos de 5 minutos eu te digo." position="center" />
      </div>
    </FadeIn>
    <FadeIn active={active} delay={300}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-2" style={{ color: C.white }}>Qual o nível da sua empresa?</h1>
    </FadeIn>
    <FadeIn active={active} delay={400}>
      <p className="text-lg text-center mb-8" style={{ color: C.gray }}>Descubra agora a maturidade da sua empresa em Gestão e IA</p>
    </FadeIn>
    <FadeIn active={active} delay={600}>
      <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8" style={{ boxShadow: `0 0 60px rgba(212,160,23,0.15)` }}>
        <QRCodeSVG value="https://orbitgestaolead.lovable.app/diagnostico" size={220} level="H" fgColor="#000000" bgColor="#ffffff" />
      </div>
    </FadeIn>
    <FadeIn active={active} delay={800}>
      <div className="flex flex-wrap gap-3 justify-center">
        {["Menos de 5 minutos", "Resultado instantâneo", "Personalizado para seu setor"].map((b, i) => (
          <div key={i} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: C.dark3, color: C.gold, border: `1px solid rgba(212,160,23,0.3)` }}>
            {b}
          </div>
        ))}
      </div>
    </FadeIn>
  </Slide>
);

/* ─── Tela 10: Demo ao Vivo ─── */
const Slide10 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-24 relative">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[150px] opacity-10" style={{ background: C.gold }} />
    </div>
    <FadeIn active={active}>
      <div className="mb-8">
        <OliviaBubble text="Chega de slide. Vamos ver na prática?" position="center" />
      </div>
    </FadeIn>
    <FadeIn active={active} delay={400}>
      <h1 className="text-5xl lg:text-7xl font-extrabold text-center mb-4" style={{ color: C.white }}>Demonstração ao Vivo</h1>
    </FadeIn>
    <FadeIn active={active} delay={600}>
      <p className="text-xl text-center" style={{ color: C.gray }}>Vou usar a empresa de um de vocês como exemplo ao vivo.</p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 11: Planos ─── */
const Slide11 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-6 lg:px-12">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-10" style={{ color: C.white }}>Investimento</h1>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl w-full mb-8">
      {[
        { name: "Smart", price: "1.200", users: "50", desc: "Ideal para pequenas empresas que querem estruturar processos e criar a cultura de gestão com base em dados", border: C.gray, badge: null },
        { name: "Pró", price: "1.997", users: "100", desc: "Desenhado para médias empresas que buscam alta performance", border: C.gold, badge: "Melhor escolha" },
        { name: "Ultra", price: "4.500", users: "300", desc: "Feito para empresas que precisam de mais robustez na gestão", border: C.goldLight, badge: null },
      ].map((plan, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 150}>
          <div className={`rounded-2xl p-7 relative h-full flex flex-col ${plan.badge ? 'ring-2' : ''}`} style={{ background: C.dark3, borderTop: `3px solid ${plan.border}`, ...(plan.badge ? { ringColor: plan.border } : {}) }}>
            {plan.badge && (
              <div className="absolute -top-3 right-5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: C.gold, color: C.dark }}>
                {plan.badge}
              </div>
            )}
            <h3 className="text-2xl font-bold mb-2 mt-1" style={{ color: C.white }}>{plan.name}</h3>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: C.gray }}>{plan.desc}</p>
            <p className="text-4xl font-extrabold mb-1" style={{ color: C.white }}>R${plan.price}<span className="text-base font-medium ml-1" style={{ color: C.gray }}>/por mês</span></p>
            <div className="flex items-center gap-2 mt-4 mb-5 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Users className="w-4 h-4" style={{ color: C.gray }} />
              <span className="text-sm" style={{ color: C.light }}>Até {plan.users} usuários</span>
            </div>
            <button className="w-full py-3 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 mb-4" style={{ background: plan.badge ? C.gold : C.dark, color: plan.badge ? C.dark : C.white, border: plan.badge ? 'none' : `1px solid ${C.gray}` }}>
              COMECE AGORA <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-xs mt-1" style={{ color: C.gray }}>Não é necessário cartão de crédito</p>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={800}>
      <p className="text-sm text-center max-w-3xl" style={{ color: C.gray }}>
        Sem cartão de crédito • Garantia de 90 dias • Plano anual com 20% de economia
      </p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 12: Garantia ─── */
const Slide12 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-24">
    <FadeIn active={active}>
      <h1 className="text-5xl lg:text-7xl font-extrabold text-center mb-4" style={{ color: C.green }}>Risco Zero</h1>
    </FadeIn>
    <FadeIn active={active} delay={300}>
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8" style={{ color: C.white }}>Garantia de Resultado</h2>
    </FadeIn>
    <FadeIn active={active} delay={600}>
      <p className="text-xl text-center max-w-2xl leading-relaxed" style={{ color: C.light }}>
        Se não gerar resultado em 90 dias, devolvemos seu investimento.
      </p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 13: Fechamento ─── */
const Slide13 = ({ active, ctaContent }: { active: boolean; ctaContent?: { subtitle?: string; buttonText?: string; buttonLink?: string } }) => {
  const subtitle = ctaContent?.subtitle || "Pronto para montar seu time de IA?";
  const buttonText = ctaContent?.buttonText || "Agendar minha configuração";
  const buttonLink = ctaContent?.buttonLink || "/chat";

  return (
  <Slide className="items-center justify-center px-8 lg:px-16 relative">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-10" style={{ background: C.gold }} />
    </div>
    <FadeIn active={active} delay={300}>
      <h1 className="text-4xl lg:text-6xl font-extrabold text-center mb-3" style={{ color: C.white }}>{subtitle}</h1>
    </FadeIn>
    <FadeIn active={active} delay={400}>
      <p className="text-lg text-center mb-10" style={{ color: C.gray }}>Vamos configurar o Orbit da sua empresa agora.</p>
    </FadeIn>
    <FadeIn active={active} delay={600}>
      <div className="flex flex-col items-center gap-4">
        <a
          href={buttonLink}
          target={buttonLink.startsWith("http") ? "_blank" : undefined}
          rel={buttonLink.startsWith("http") ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg"
          style={{ background: C.gold, color: C.dark, boxShadow: `0 8px 30px rgba(212,160,23,0.3)` }}
        >
          {buttonText} <ArrowRight className="w-6 h-6" />
        </a>
      </div>
    </FadeIn>
  </Slide>
  );
};

/* ─── Main ─── */
const ALL_SLIDES = [Slide01, Slide02, Slide03, Slide04, Slide05, Slide06, Slide07, Slide08, Slide09, Slide10, Slide11, Slide12, Slide13];

export default function Apresentacao() {
  const [visibilityMap, setVisibilityMap] = useState<Record<number, boolean>>({});
  const [ctaContent, setCtaContent] = useState<{ subtitle?: string; buttonText?: string; buttonLink?: string } | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("presentation_slides")
      .select("slide_order, is_active, content")
      .order("slide_order")
      .then(({ data }) => {
        if (data) {
          const map: Record<number, boolean> = {};
          data.forEach((row: any) => {
            map[row.slide_order] = row.is_active;
            if (row.slide_order === 12 && row.content) {
              setCtaContent(row.content as any);
            }
          });
          setVisibilityMap(map);
        }
        setLoaded(true);
      });
  }, []);

  const SLIDES = useMemo(() => {
    if (!loaded) return ALL_SLIDES;
    return ALL_SLIDES.filter((_, i) => visibilityMap[i] !== false);
  }, [loaded, visibilityMap]);

  if (!loaded) return null;

  return (
    <PresentationShell totalSlides={SLIDES.length}>
      {SLIDES.map((SlideComp, i) => (
        SlideComp === Slide13
          ? <Slide13 key={i} active={true} ctaContent={ctaContent} />
          : <SlideComp key={i} active={true} />
      ))}
    </PresentationShell>
  );
}
