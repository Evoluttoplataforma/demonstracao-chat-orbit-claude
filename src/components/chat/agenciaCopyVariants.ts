export interface AgenciaCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const AGENCIA_COPY_VARIANTS: AgenciaCopyVariant[] = [
  {
    id: "AG-A",
    headline: "SUA AGÊNCIA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "ISSO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre atrás de prazos, refaz entregas e perde clientes, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MINHA AGÊNCIA",
  },
  {
    id: "AG-B",
    headline: "CLIENTE SAIU, FUNCIONÁRIO PEDIU DEMISSÃO, PRAZO ESTOUROU.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE NORMAL?",
    description:
      "Agências sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "AG-C",
    headline: "VOCÊ FUNDOU UMA AGÊNCIA, NÃO UMA",
    highlightedPart: "FÁBRICA DE RETRABALHO.",
    description:
      "Se cada entrega depende de você para dar certo, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão da sua agência automaticamente.",
    cta: "QUERO PARAR O RETRABALHO",
  },
  {
    id: "AG-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM ANALISTA.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro da sua agência. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "AG-E",
    headline: "GESTÃO DE AGÊNCIA NÃO É SOBRE COBRAR A EQUIPE.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar sua agência.",
    cta: "QUERO ESCALAR MINHA AGÊNCIA",
  },
];

export function getAgenciaSessionVariant(): AgenciaCopyVariant {
  const KEY = "agencia_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = AGENCIA_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = AGENCIA_COPY_VARIANTS[Math.floor(Math.random() * AGENCIA_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
