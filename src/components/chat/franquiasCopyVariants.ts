export interface FranquiasCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const FRANQUIAS_COPY_VARIANTS: FranquiasCopyVariant[] = [
  {
    id: "FR-A",
    headline: "SUA FRANQUIA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre entre unidades, resolve problemas de franqueados, cobra padrão e tenta não perder controle, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MINHA FRANQUIA",
  },
  {
    id: "FR-B",
    headline: "UNIDADE FORA DO PADRÃO, FRANQUEADO RECLAMANDO, INDICADOR NO VERMELHO.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Franquias sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "FR-C",
    headline: "VOCÊ CRIOU UMA FRANQUIA, NÃO UMA",
    highlightedPart: "FÁBRICA DE PROBLEMAS OPERACIONAIS.",
    description:
      "Se cada unidade depende de você para funcionar, o problema não é o franqueado — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão da sua rede automaticamente.",
    cta: "QUERO PARAR O CAOS OPERACIONAL",
  },
  {
    id: "FR-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM COORDENADOR.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro da sua rede de franquias. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "FR-E",
    headline: "GESTÃO DE FRANQUIA NÃO É SOBRE COBRAR FRANQUEADO.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar sua rede.",
    cta: "QUERO ESCALAR MINHA FRANQUIA",
  },
];

export function getFranquiasSessionVariant(): FranquiasCopyVariant {
  const KEY = "franquias_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = FRANQUIAS_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = FRANQUIAS_COPY_VARIANTS[Math.floor(Math.random() * FRANQUIAS_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
