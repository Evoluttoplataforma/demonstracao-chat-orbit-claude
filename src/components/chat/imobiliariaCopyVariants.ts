export interface ImobiliariaCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const IMOBILIARIA_COPY_VARIANTS: ImobiliariaCopyVariant[] = [
  {
    id: "IM-A",
    headline: "SUA IMOBILIÁRIA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre entre vistorias, resolve conflito com inquilino, cobra equipe e tenta não perder negócio, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MINHA IMOBILIÁRIA",
  },
  {
    id: "IM-B",
    headline: "CORRETOR SUMIU, CONTRATO ATRASOU, CLIENTE RECLAMOU.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Imobiliárias sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "IM-C",
    headline: "VOCÊ ABRIU UMA IMOBILIÁRIA, NÃO UMA",
    highlightedPart: "FÁBRICA DE PROBLEMAS OPERACIONAIS.",
    description:
      "Se cada decisão depende de você para acontecer, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão da sua imobiliária automaticamente.",
    cta: "QUERO PARAR O CAOS OPERACIONAL",
  },
  {
    id: "IM-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM COORDENADOR.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro da sua imobiliária. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "IM-E",
    headline: "GESTÃO DE IMOBILIÁRIA NÃO É SOBRE COBRAR CORRETOR.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar sua imobiliária.",
    cta: "QUERO ESCALAR MINHA IMOBILIÁRIA",
  },
];

export function getImobiliariaSessionVariant(): ImobiliariaCopyVariant {
  const KEY = "imobiliaria_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = IMOBILIARIA_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = IMOBILIARIA_COPY_VARIANTS[Math.floor(Math.random() * IMOBILIARIA_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
