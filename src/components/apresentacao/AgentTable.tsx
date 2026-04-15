import FadeIn from "./FadeIn";

const AGENTS = [
  { agent: "Ag. Estrategista", desc: "Planejamento, SWOT, BSC, objetivos", equivalent: "Consultor — R$30-80k/proj" },
  { agent: "Ag. Processos", desc: "Mapeia processos, playbooks, padrões", equivalent: "Analista sênior — R$8-12k/mês" },
  { agent: "Ag. Pessoas", desc: "Cargos, desempenho, PDIs", equivalent: "Analista DHO — R$6-10k/mês" },
  { agent: "Ag. Treinamento", desc: "Microlearning via WhatsApp + quizzes", equivalent: "Coord. T&D — R$7-12k/mês" },
  { agent: "Ag. Indicadores", desc: "KPIs, causa raiz, ações corretivas", equivalent: "Analista BI — R$8-15k/mês" },
  { agent: "Ag. Pesquisa", desc: "Formulários, clima, insights", equivalent: "Analista dados — R$6-10k/mês" },
  { agent: "Ag. Riscos", desc: "Riscos estratégicos, mitigações", equivalent: "Analista riscos — R$8-12k/mês" },
  { agent: "Ag. Oportunidades", desc: "Mercado, portfólio, parcerias", equivalent: "Analista intel. — R$8-12k/mês" },
  { agent: "Ag. Problemas", desc: "NC, causa raiz, ações corretivas", equivalent: "Analista melhoria — R$7-10k/mês" },
  { agent: "Ag. Documentos", desc: "Docs corporativos conectados", equivalent: "Analista doc. — R$5-8k/mês" },
  { agent: "Ag. Vendas", desc: "CRM, funil, coaching comercial", equivalent: "Consultor com. — R$10-15k/mês" },
  { agent: "Ag. Reuniões", desc: "Transcrição, análise, distribuição", equivalent: "Assist. exec. — R$5-8k/mês" },
];

interface Props {
  active: boolean;
  subtitle?: string;
}

export default function AgentTable({ active, subtitle }: Props) {
  return (
    <FadeIn active={active} delay={200}>
      <div className="w-full max-w-5xl rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,209,217,0.1)" }}>
        <div className="grid grid-cols-[1fr_2fr_1.2fr]" style={{ background: "rgba(212,160,23,0.12)", borderBottom: "1px solid rgba(201,209,217,0.1)" }}>
          <div className="px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "#D4A017" }}>Agente</div>
          <div className="px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "#D4A017" }}>O que faz</div>
          <div className="px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "#D4A017" }}>Equivalente humano</div>
        </div>
        {AGENTS.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_2fr_1.2fr] transition-colors"
            style={{
              background: i % 2 === 0 ? "rgba(28,35,51,0.3)" : "rgba(28,35,51,0.6)",
              borderBottom: i < AGENTS.length - 1 ? "1px solid rgba(201,209,217,0.06)" : "none",
            }}
          >
            <div className="px-4 py-2 text-sm font-bold" style={{ color: "#FFFFFF" }}>{r.agent}</div>
            <div className="px-4 py-2 text-sm" style={{ color: "#8B949E" }}>{r.desc}</div>
            <div className="px-4 py-2 text-sm italic" style={{ color: "#D4A017" }}>{r.equivalent}</div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
