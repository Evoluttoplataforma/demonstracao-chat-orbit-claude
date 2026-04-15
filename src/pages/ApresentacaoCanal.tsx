import PresentationShell from "@/components/apresentacao/PresentationShell";
import FadeIn from "@/components/apresentacao/FadeIn";
import OliviaBubble from "@/components/apresentacao/OliviaBubble";
import AgentOrbit from "@/components/apresentacao/AgentOrbit";
import AnimatedCounter from "@/components/apresentacao/AnimatedCounter";
import { ArrowRight, CheckCircle } from "lucide-react";

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

const Slide = ({ children, bg = C.dark, className = "" }: { children: React.ReactNode; bg?: string; className?: string }) => (
  <div className={`h-full w-full overflow-y-auto flex flex-col ${className}`} style={{ background: bg }}>{children}</div>
);

/* ─── Tela 1: Abertura Canal ─── */
const Slide01 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 relative">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-[120px] opacity-10" style={{ background: C.gold }} />
    </div>
    <FadeIn active={active}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: C.gold }}>
          <span className="text-2xl font-extrabold" style={{ color: C.dark }}>O</span>
        </div>
        <span className="text-4xl font-extrabold tracking-tight" style={{ color: C.white }}>Orbit</span>
      </div>
    </FadeIn>
    <FadeIn active={active} delay={200}>
      <p className="text-lg font-semibold uppercase tracking-widest mb-10" style={{ color: C.gold }}>PARA CONSULTORES</p>
    </FadeIn>
    <FadeIn active={active} delay={500}>
      <OliviaBubble text="Se você é consultor, mentor ou dono de consultoria, tenho algo que vai mudar a economia do seu negócio. Me dá uns minutos?" position="center" />
    </FadeIn>
  </Slide>
);

/* ─── Tela 2: Dilema do Consultor ─── */
const Slide02 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-3xl lg:text-5xl font-extrabold text-center mb-10 leading-tight" style={{ color: C.white }}>
        Você entrega o projeto. O cliente vai embora. E o ciclo recomeça.
      </h1>
    </FadeIn>
    <div className="flex flex-col gap-4 max-w-3xl w-full mb-8">
      {[
        "Churn de projetos: Cada trimestre você recomeça do zero",
        "Escala limitada: Sua receita é proporcional às suas horas",
        "Ameaça da IA: 66% dos compradores vão deixar de contratar consultorias que não usem IA (IBM, 2025)",
      ].map((item, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 150}>
          <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: C.dark3, borderLeft: `4px solid ${C.red}` }}>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{item}</p>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={800}>
      <p className="text-lg text-center max-w-3xl font-semibold" style={{ color: C.gold }}>
        A boa notícia: esse problema tem solução. E a solução cria um modelo de negócio melhor que o atual.
      </p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 3: Tese Consultoria Recorrente Passiva ─── */
const Slide03 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-10" style={{ color: C.white }}>A consultoria não morre. Ela evolui.</h1>
    </FadeIn>
    <FadeIn active={active} delay={300}>
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-8">
        {[
          { label: "Consultoria Artesanal", color: C.gray },
          { label: "Consultoria Digitalizada", color: C.gold },
          { label: "Consultoria Recorrente Passiva", color: C.green },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 h-28 rounded-full flex items-center justify-center text-center p-3" style={{ border: `3px solid ${s.color}`, background: `${s.color}10` }}>
              <span className="text-xs font-bold leading-tight" style={{ color: s.color }}>{s.label}</span>
            </div>
            {i < 2 && <ArrowRight className="w-6 h-6 hidden lg:block" style={{ color: C.gold }} />}
          </div>
        ))}
      </div>
    </FadeIn>
    <FadeIn active={active} delay={600}>
      <div className="max-w-3xl rounded-xl p-6 mb-6" style={{ background: C.dark3 }}>
        <p className="text-sm leading-relaxed mb-3" style={{ color: C.light }}>
          <strong style={{ color: C.white }}>O que é consultoria recorrente passiva?</strong> Você faz o projeto consultivo. Quando termina, agentes de IA continuam operando dentro do cliente — monitorando indicadores, gerando relatórios, treinando equipe, ajustando processos. Todos os dias. Sem parar. Sem você precisar estar lá.
        </p>
        <p className="text-sm font-semibold" style={{ color: C.gold }}>Projeto pontual vira operação contínua. Fee único vira receita recorrente. Passiva.</p>
      </div>
    </FadeIn>
    <FadeIn active={active} delay={800}>
      <OliviaBubble text="Imagina se cada cliente que você já atendeu continuasse pagando todo mês. Com agentes, isso é possível." position="center" />
    </FadeIn>
  </Slide>
);

/* ─── Tela 4: Quem Somos Canal ─── */
const Slide04 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-3xl lg:text-5xl font-extrabold text-center mb-10 leading-tight" style={{ color: C.white }}>
        O maior grupo de consultoria em gestão do Brasil. Agora, sua plataforma.
      </h1>
    </FadeIn>
    <div className="flex flex-col gap-5 max-w-3xl w-full">
      {[
        "30 anos com a Templum: +8.000 empresas. Líder em ISO. A credibilidade que você herda.",
        "10 anos digitalizando consultorias: Fomos os primeiros. 30+ consultores já operam conosco.",
        "Orbit: Plataforma de gestão com IA que permite você entregar consultoria recorrente passiva.",
      ].map((item, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 200}>
          <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: C.dark3, borderLeft: `4px solid ${C.gold}` }}>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{item}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  </Slide>
);

/* ─── Tela 5: Como Funciona ─── */
const Slide05 = ({ active }: { active: boolean }) => (
  <Slide bg={C.dark2} className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-10" style={{ color: C.white }}>Seu modelo de negócio em 4 passos</h1>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 max-w-5xl w-full mb-8">
      {[
        { num: "1", title: "Diagnóstico", desc: "Mapeie o nível de maturidade do cliente com o diagnóstico Orbit." },
        { num: "2", title: "Configuração dos Agentes", desc: "Configure os agentes de IA com sua expertise consultiva." },
        { num: "3", title: "Ativação", desc: "Ative o Orbit dentro do cliente. Agentes começam a operar." },
        { num: "4", title: "Receita Recorrente Passiva", desc: "Cliente paga mensalidade. Você recebe comissão. Sem operar." },
      ].map((step, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 150}>
          <div className="rounded-xl p-6 h-full" style={{ background: C.dark3, borderTop: `3px solid ${C.gold}` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold mb-3" style={{ background: C.gold, color: C.dark }}>
              {step.num}
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: C.white }}>{step.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{step.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={900}>
      <p className="text-sm text-center font-semibold" style={{ color: C.gray }}>
        Tudo isso ALÉM do fee consultivo que você cobra pelo projeto.
      </p>
    </FadeIn>
  </Slide>
);

/* ─── Tela 6: Economia do Canal ─── */
const Slide06 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-10" style={{ color: C.white }}>A matemática que muda tudo</h1>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
      {[
        { count: 10, label: "clientes", desc: "Receita recorrente significativa", border: C.gold },
        { count: 30, label: "clientes", desc: "Consultoria que gera receita passiva", border: C.green },
        { count: 50, label: "clientes", desc: "Negócio de plataforma, não mais de projeto", border: C.goldLight },
      ].map((card, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 200}>
          <div className="rounded-xl p-7 text-center" style={{ background: C.dark3, borderTop: `3px solid ${card.border}` }}>
            <AnimatedCounter value={card.count} active={active} className="text-5xl font-extrabold block mb-1" style={{ color: card.border }} />
            <p className="text-sm mb-3" style={{ color: C.gray }}>{card.label}</p>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{card.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={900}>
      <OliviaBubble text="Cada cliente ativado é receita que continua entrando. Você para de recomeçar do zero." position="center" />
    </FadeIn>
  </Slide>
);

/* ─── Tela 7: Agentes Canal ─── */
const Slide07 = ({ active }: { active: boolean }) => (
  <Slide className="items-center pt-2 pb-2 px-6 lg:px-12 overflow-hidden">
    <FadeIn active={active}>
      <h1 className="text-2xl lg:text-3xl font-extrabold text-center mb-0.5" style={{ color: C.white }}>O que você entrega ao seu cliente</h1>
    </FadeIn>
    <FadeIn active={active} delay={100}>
      <p className="text-xs uppercase tracking-widest text-center mb-2" style={{ color: C.gray }}>12 agentes que você configura com sua expertise</p>
    </FadeIn>
    <AgentOrbit active={active} />
    <FadeIn active={active} delay={500}>
      <div className="mt-2 w-full max-w-5xl px-5 py-2 rounded-lg text-center" style={{ background: "rgba(212,160,23,0.2)" }}>
        <p className="text-sm font-bold" style={{ color: C.white }}>Seu cliente precisaria de R$100-200k/mês. Você entrega pelo Orbit.</p>
      </div>
    </FadeIn>
  </Slide>
);

/* ─── Tela 8: Prova Social ─── */
const Slide08 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-12" style={{ color: C.white }}>30+ consultores já operam com o Orbit</h1>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl w-full mb-10">
      {[
        { value: "30+", label: "canais parceiros" },
        { value: "15+", label: "com clientes ativos" },
        { value: "10+", label: "com 10+ clientes" },
      ].map((s, i) => (
        <FadeIn key={i} active={active} delay={300 + i * 200}>
          <div className="rounded-xl p-8 text-center" style={{ background: C.dark3 }}>
            <p className="text-5xl font-extrabold mb-2" style={{ color: C.gold }}>{s.value}</p>
            <p className="text-sm" style={{ color: C.light }}>{s.label}</p>
          </div>
        </FadeIn>
      ))}
    </div>
    <FadeIn active={active} delay={900}>
      <div className="max-w-2xl rounded-xl p-6 text-center" style={{ background: C.dark3, border: `1px dashed rgba(212,160,23,0.3)` }}>
        <p className="text-sm italic" style={{ color: C.gray }}>Espaço para depoimentos de consultores parceiros</p>
      </div>
    </FadeIn>
  </Slide>
);

/* ─── Tela 9: Benefícios ─── */
const Slide09 = ({ active }: { active: boolean }) => (
  <Slide bg={C.dark2} className="items-center justify-center px-8 lg:px-16">
    <FadeIn active={active}>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-10" style={{ color: C.white }}>Tudo que você precisa para escalar</h1>
    </FadeIn>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl w-full">
      {[
        { title: "Plataforma completa", desc: "Orbit com todos os agentes de IA para seus clientes." },
        { title: "Treinamento", desc: "Capacitação completa para você configurar e vender." },
        { title: "Alpha Club", desc: "Comunidade exclusiva de consultores parceiros." },
        { title: "Suporte dedicado", desc: "Time de suporte para você e seus clientes." },
        { title: "Sua marca", desc: "Consultoria com sua identidade, potencializada pelo Orbit." },
        { title: "Receita recorrente passiva", desc: "Comissão mensal por cada cliente ativo." },
      ].map((card, i) => (
        <FadeIn key={i} active={active} delay={200 + i * 100}>
          <div className="rounded-xl p-6 h-full" style={{ background: C.dark3 }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 shrink-0" style={{ color: C.gold }} />
              <h3 className="text-base font-bold" style={{ color: C.white }}>{card.title}</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: C.light }}>{card.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  </Slide>
);

/* ─── Tela 10: Próximo Passo ─── */
const Slide10 = ({ active }: { active: boolean }) => (
  <Slide className="items-center justify-center px-8 lg:px-16 relative">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-10" style={{ background: C.gold }} />
    </div>
    <FadeIn active={active}>
      <div className="mb-8">
        <OliviaBubble text="O próximo passo é uma conversa de 30 minutos. Sem compromisso." position="center" />
      </div>
    </FadeIn>
    <FadeIn active={active} delay={300}>
      <h1 className="text-4xl lg:text-6xl font-extrabold text-center mb-3" style={{ color: C.white }}>Pronto para escalar sua consultoria?</h1>
    </FadeIn>
    <FadeIn active={active} delay={500}>
      <div className="flex flex-col items-center gap-4 mt-8">
        <a
          href="/chat"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg"
          style={{ background: C.gold, color: C.dark, boxShadow: `0 8px 30px rgba(212,160,23,0.3)` }}
        >
          Agendar conversa com o time Orbit <ArrowRight className="w-6 h-6" />
        </a>
        <a href="#" className="text-base font-medium underline underline-offset-4" style={{ color: C.gold }}>
          Quero conhecer a comunidade Alpha Club primeiro
        </a>
      </div>
    </FadeIn>
    <FadeIn active={active} delay={700}>
      <div className="mt-10 w-full max-w-4xl rounded-lg px-6 py-3 flex flex-wrap items-center justify-center gap-4 text-xs" style={{ background: C.dark2, color: C.gray }}>
        {["30 anos", "8.000+ empresas", "30+ consultores parceiros", "Alpha Club"].map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: C.gold }}>•</span>}
            {item}
          </span>
        ))}
      </div>
    </FadeIn>
  </Slide>
);

const SLIDES = [Slide01, Slide02, Slide03, Slide04, Slide05, Slide06, Slide07, Slide08, Slide09, Slide10];

export default function ApresentacaoCanal() {
  return (
    <PresentationShell totalSlides={SLIDES.length}>
      {SLIDES.map((SlideComp, i) => (
        <SlideComp key={i} active={true} />
      ))}
    </PresentationShell>
  );
}
