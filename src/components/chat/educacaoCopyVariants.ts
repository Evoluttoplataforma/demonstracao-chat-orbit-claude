export interface EducacaoCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const EDUCACAO_COPY_VARIANTS: EducacaoCopyVariant[] = [
  {
    id: "ED-A",
    headline: "SUA ESCOLA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre entre matrículas, resolve conflitos com pais, cobra equipe pedagógica e tenta reduzir inadimplência, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MINHA ESCOLA",
  },
  {
    id: "ED-B",
    headline: "MATRÍCULA CANCELADA, PROFESSOR FALTOU, INADIMPLÊNCIA SUBIU.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Instituições de ensino sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "ED-C",
    headline: "VOCÊ ABRIU UMA ESCOLA, NÃO UMA",
    highlightedPart: "FÁBRICA DE PROBLEMAS OPERACIONAIS.",
    description:
      "Se cada decisão depende de você para acontecer, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão da sua escola automaticamente.",
    cta: "QUERO PARAR O CAOS OPERACIONAL",
  },
  {
    id: "ED-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM COORDENADOR.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro da sua escola. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "ED-E",
    headline: "GESTÃO ESCOLAR NÃO É SOBRE COBRAR PROFESSOR.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar sua escola.",
    cta: "QUERO ESCALAR MINHA ESCOLA",
  },
];

export function getEducacaoSessionVariant(): EducacaoCopyVariant {
  const KEY = "educacao_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = EDUCACAO_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = EDUCACAO_COPY_VARIANTS[Math.floor(Math.random() * EDUCACAO_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
