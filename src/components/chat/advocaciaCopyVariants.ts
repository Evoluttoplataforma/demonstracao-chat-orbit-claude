export interface AdvocaciaCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const ADVOCACIA_COPY_VARIANTS: AdvocaciaCopyVariant[] = [
  {
    id: "AD-A",
    headline: "SEU ESCRITÓRIO DE ADVOCACIA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre entre audiências, resolve urgências de clientes, cobra equipe e tenta não perder prazos, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MEU ESCRITÓRIO",
  },
  {
    id: "AD-B",
    headline: "PRAZO PERDIDO, CLIENTE RECLAMOU, SÓCIO SOBRECARREGADO.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Escritórios de advocacia sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "AD-C",
    headline: "VOCÊ ABRIU UM ESCRITÓRIO DE ADVOCACIA, NÃO UMA",
    highlightedPart: "FÁBRICA DE RETRABALHO.",
    description:
      "Se cada petição, cada prazo e cada decisão depende de você, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão do seu escritório automaticamente.",
    cta: "QUERO PARAR O RETRABALHO",
  },
  {
    id: "AD-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM ANALISTA.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro do seu escritório de advocacia. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "AD-E",
    headline: "GESTÃO DE ESCRITÓRIO NÃO É SOBRE COBRAR ADVOGADO.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar seu escritório.",
    cta: "QUERO ESCALAR MEU ESCRITÓRIO",
  },
];

export function getAdvocaciaSessionVariant(): AdvocaciaCopyVariant {
  const KEY = "advocacia_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = ADVOCACIA_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = ADVOCACIA_COPY_VARIANTS[Math.floor(Math.random() * ADVOCACIA_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
