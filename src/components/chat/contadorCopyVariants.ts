export interface ContadorCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const CONTADOR_COPY_VARIANTS: ContadorCopyVariant[] = [
  {
    id: "CT-A",
    headline: "SEU ESCRITÓRIO CONTÁBIL VIVE NO AUTOMÁTICO?",
    highlightedPart: "AUTOMÁTICO NÃO É GESTÃO. É RISCO.",
    description:
      "Enquanto você corre atrás de prazos fiscais, refaz obrigações e perde clientes por falta de proatividade, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MEU ESCRITÓRIO",
  },
  {
    id: "CT-B",
    headline: "CLIENTE RECLAMOU, PRAZO ESTOUROU, FUNCIONÁRIO ERROU.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Escritórios contábeis sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "CT-C",
    headline: "VOCÊ ABRIU UM ESCRITÓRIO CONTÁBIL, NÃO UMA",
    highlightedPart: "FÁBRICA DE RETRABALHO.",
    description:
      "Se cada entrega depende de você para sair certa, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão do seu escritório automaticamente.",
    cta: "QUERO PARAR O RETRABALHO",
  },
  {
    id: "CT-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM ANALISTA.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro do seu escritório contábil. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "CT-E",
    headline: "GESTÃO DE ESCRITÓRIO CONTÁBIL NÃO É SOBRE COBRAR A EQUIPE.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar seu escritório.",
    cta: "QUERO ESCALAR MEU ESCRITÓRIO",
  },
];

export function getContadorSessionVariant(): ContadorCopyVariant {
  const KEY = "contador_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = CONTADOR_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = CONTADOR_COPY_VARIANTS[Math.floor(Math.random() * CONTADOR_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
