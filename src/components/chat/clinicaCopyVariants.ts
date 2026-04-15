export interface ClinicaCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const CLINICA_COPY_VARIANTS: ClinicaCopyVariant[] = [
  {
    id: "CL-A",
    headline: "SUA CLÍNICA VIVE APAGANDO INCÊNDIO?",
    highlightedPart: "APAGAR INCÊNDIO NÃO É GESTÃO. É SOBREVIVÊNCIA.",
    description:
      "Enquanto você corre entre atendimentos, resolve conflitos de agenda, cobra equipe e tenta não perder pacientes, dezenas de agentes de IA podem organizar sua operação, padronizar processos e monitorar resultados — 24/7, sem férias.",
    cta: "QUERO ORGANIZAR MINHA CLÍNICA",
  },
  {
    id: "CL-B",
    headline: "PACIENTE RECLAMOU, AGENDA FUROU, FUNCIONÁRIO FALTOU.",
    highlightedPart: "E VOCÊ AINDA CHAMA ISSO DE ROTINA?",
    description:
      "Clínicas sem gestão vivem no caos. O Orbit coloca dezenas de agentes de IA especializados para estruturar processos, treinar equipe, monitorar indicadores e acabar com o retrabalho — de verdade.",
    cta: "QUERO SAIR DO CAOS",
  },
  {
    id: "CL-C",
    headline: "VOCÊ ABRIU UMA CLÍNICA, NÃO UMA",
    highlightedPart: "FÁBRICA DE PROBLEMAS OPERACIONAIS.",
    description:
      "Se cada decisão depende de você para acontecer, o problema não é a equipe — é a falta de processo. Dezenas de agentes de IA do Orbit estruturam, padronizam e executam a gestão da sua clínica automaticamente.",
    cta: "QUERO PARAR O CAOS OPERACIONAL",
  },
  {
    id: "CL-D",
    headline: "CONTRATE DEZENAS DE ESPECIALISTAS EM GESTÃO",
    highlightedPart: "POR UMA FRAÇÃO DO CUSTO DE UM COORDENADOR.",
    description:
      "Agentes de IA que fazem planejamento, gestão de processos, treinamento, indicadores e mais — executando 24/7 dentro da sua clínica. Sem CLT, sem encargos, sem falta.",
    cta: "QUERO CONHECER MEU TIME DE IA",
  },
  {
    id: "CL-E",
    headline: "GESTÃO DE CLÍNICA NÃO É SOBRE COBRAR A EQUIPE.",
    highlightedPart: "É SOBRE TER QUEM EXECUTE.",
    description:
      "O Orbit entrega um time completo de agentes de IA que estrutura processos, treina pessoas e monitora resultados — para que você pare de microgerenciar e comece a escalar sua clínica.",
    cta: "QUERO ESCALAR MINHA CLÍNICA",
  },
];

export function getClinicaSessionVariant(): ClinicaCopyVariant {
  const KEY = "clinica_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = CLINICA_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = CLINICA_COPY_VARIANTS[Math.floor(Math.random() * CLINICA_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
