export interface EcommerceCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const ECOMMERCE_COPY_VARIANTS: EcommerceCopyVariant[] = [
  {
    id: "EC-A",
    headline: "SEU E-COMMERCE VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre atrás de estoque, resolve problemas de logística, cobra equipe e tenta não perder clientes, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MEU E-COMMERCE",
  },
  {
    id: "EC-B",
    headline: "ESTOQUE FURADO, ENTREGA ATRASADA, CLIENTE RECLAMANDO.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "E-commerces sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "EC-C",
    headline: "VOCÊ CRIOU UM E-COMMERCE, NÃO UMA",
    highlightedPart: "FÁBRICA DE PROBLEMAS OPERACIONAIS.",
    description:
      "Se cada decisão depende de você para acontecer, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão do seu e-commerce automaticamente.",
    cta: "QUERO PARAR O CAOS OPERACIONAL",
  },
  {
    id: "EC-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM COORDENADOR.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro do seu e-commerce. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "EC-E",
    headline: "GESTÃO DE E-COMMERCE NÃO É SOBRE COBRAR A EQUIPE.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar seu e-commerce.",
    cta: "QUERO ESCALAR MEU E-COMMERCE",
  },
];

export function getEcommerceSessionVariant(): EcommerceCopyVariant {
  const KEY = "ecommerce_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = ECOMMERCE_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = ECOMMERCE_COPY_VARIANTS[Math.floor(Math.random() * ECOMMERCE_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
