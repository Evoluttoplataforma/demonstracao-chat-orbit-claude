export interface ConsultorCopyVariant {
  id: string;
  headline: string;
  highlightedPart: string;
  description: string;
  cta: string;
}

export const CONSULTOR_COPY_VARIANTS: ConsultorCopyVariant[] = [
  {
    id: "CA",
    headline: "PARE DE VENDER PROJETO. COMECE A VENDER",
    highlightedPart: "OPERAÇÃO DE IA QUE GERA RECORRÊNCIA PASSIVA.",
    description:
      "Transforme consultoria pontual em recorrência passiva. Seus clientes ficam, sua receita cresce, dezenas de agentes de IA trabalham 24/7 — coordenados pela Olívia.",
    cta: "QUERO ESCALAR MINHA CONSULTORIA",
  },
  {
    id: "CB",
    headline: "10 CLIENTES = R$25.000/MÊS NO SEU BOLSO.",
    highlightedPart: "SEM DEPENDER DE NOVOS PROJETOS.",
    description:
      "Com o Orbit Full White Label, você implanta agentes de IA nos seus clientes e cobra recorrência passiva mensal. Sem recomeçar do zero todo mês, sem depender de novos projetos.",
    cta: "QUERO RECEITA RECORRENTE",
  },
  {
    id: "CC",
    headline: "ESSE É O MAIOR ERRO DOS CONSULTORES HOJE.",
    highlightedPart: "ENTREGAR E SAIR DE CENA.",
    description:
      "Entregar e sair de cena mata a recorrência passiva e a escala. Com o Orbit Full White Label, você continua gerando valor no dia a dia do cliente — automaticamente, com dezenas de agentes de IA.",
    cta: "ATIVAR MINHA RECORRÊNCIA PASSIVA",
  },
  {
    id: "CD",
    headline: "SUA CONSULTORIA PODE GERAR VALOR",
    highlightedPart: "TODOS OS MESES.",
    description:
      "Saia dos projetos pontuais e gere receita recorrente passiva com agentes de IA no dia a dia do cliente. Sua marca, seu preço, sua operação — tudo Full White Label.",
    cta: "QUERO ESCALAR MINHA CONSULTORIA",
  },
  {
    id: "CE",
    headline: "CONSULTORIA, VOCÊ NÃO PRECISA AUMENTAR A EQUIPE",
    highlightedPart: "PARA ESCALAR!",
    description:
      "Escalar com mais gente pesa no custo e na gestão. Há uma forma mais inteligente de gerar recorrência passiva: dezenas de agentes de IA que executam nos seus clientes 24/7, com a sua marca — Full White Label.",
    cta: "QUERO CRESCER SEM AUMENTAR EQUIPE",
  },
];

export function getConsultorSessionVariant(): ConsultorCopyVariant {
  const KEY = "consultor_copy_variant";
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const variant = CONSULTOR_COPY_VARIANTS.find((v) => v.id === stored);
    if (variant) return variant;
  }
  const variant = CONSULTOR_COPY_VARIANTS[Math.floor(Math.random() * CONSULTOR_COPY_VARIANTS.length)];
  sessionStorage.setItem(KEY, variant.id);
  return variant;
}
