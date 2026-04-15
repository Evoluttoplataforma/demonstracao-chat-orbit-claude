export interface EngenhariaCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const ENGENHARIA_COPY_VARIANTS: EngenhariaCopyVariant[] = [
  {
    id: "EN-A",
    headline: "SUA EMPRESA DE ENGENHARIA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre entre obras, resolve retrabalho, cobra prazos e tenta não estourar orçamento, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MINHA EMPRESA",
  },
  {
    id: "EN-B",
    headline: "OBRA ATRASOU, ORÇAMENTO ESTOUROU, EQUIPE PERDIDA.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Empresas de engenharia sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "EN-C",
    headline: "VOCÊ ABRIU UMA EMPRESA DE ENGENHARIA, NÃO UMA",
    highlightedPart: "FÁBRICA DE PROBLEMAS OPERACIONAIS.",
    description:
      "Se cada decisão depende de você para acontecer, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão da sua empresa automaticamente.",
    cta: "QUERO PARAR O CAOS OPERACIONAL",
  },
  {
    id: "EN-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM COORDENADOR.",
    description:
      "Agentes de IA que fazem planejamento, gestão de projetos, treinamento, indicadores e mais — executando 24/7 dentro da sua empresa. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "EN-E",
    headline: "GESTÃO DE ENGENHARIA NÃO É SOBRE COBRAR ENCARREGADO.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar sua empresa.",
    cta: "QUERO ESCALAR MINHA EMPRESA",
  },
];

export function getEngenhariaSessionVariant(): EngenhariaCopyVariant {
  const KEY = "engenharia_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = ENGENHARIA_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = ENGENHARIA_COPY_VARIANTS[Math.floor(Math.random() * ENGENHARIA_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
