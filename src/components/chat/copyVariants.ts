export interface CopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const COPY_VARIANTS: CopyVariant[] = [
  {
    id: "A",
    headline: "PROBLEMAS REPETIDOS, ERROS E RETRABALHO NÃO SÃO NORMAIS.",
    highlightedPart: "SÃO FALTA DE TIME.",
    description:
      "Seu time humano não dá conta de tudo — e não deveria. O Orbit coloca agentes de IA especializados para executar a gestão da sua empresa 24/7. Mais de 2.206 empresas já contrataram seu time de IA.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "B",
    headline: "SEM PROCESSO, SUA EMPRESA PERDE DINHEIRO.",
    highlightedPart: "SEM UM TIME QUE EXECUTE, NADA MUDA.",
    description:
      "Enquanto você apaga incêndios, seus concorrentes já contrataram agentes de IA para executar processos, monitorar indicadores e treinar equipes — automaticamente. Descubra o Orbit em 7 dias.",
    cta: "QUERO PARAR DE PERDER DINHEIRO",
  },
  {
    id: "C",
    headline: "ENQUANTO SEUS CONCORRENTES IMPROVISAM, EMPRESAS COM ORBIT TÊM",
    highlightedPart: "UM TIME DE IA EXECUTANDO.",
    description:
      "12 agentes especializados que planejam, organizam processos, treinam equipe e monitoram indicadores — sem parar, sem férias, sem erro. Mais de 2.206 empresas já operam assim.",
    cta: "QUERO SAIR DO CAOS OPERACIONAL",
  },
  {
    id: "D",
    headline: "CONTRATE 12 FUNCIONÁRIOS ESPECIALIZADOS",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM.",
    description:
      "Agentes de IA que fazem planejamento estratégico, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro da sua operação. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "E",
    headline: "GESTÃO NÃO É SOBRE COBRAR SUA EQUIPE.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a liderar.",
    cta: "QUERO SAIR DO CAOS AGORA",
  },
];

/**
 * Get or assign a copy variant for the current session.
 * Persists in sessionStorage so the user sees the same variant throughout.
 */
export function getSessionVariant(): CopyVariant {
  const KEY = "hero_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = COPY_VARIANTS[Math.floor(Math.random() * COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
