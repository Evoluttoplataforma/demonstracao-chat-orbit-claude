export interface ConsultorQuestion {
  id: number;
  category: "canal";
  theme: string;
  question: string;
  levels: {
    "1": string;
    "2": string;
    "3": string;
    "4": string;
    "5": string;
  };
}

export const CONSULTOR_DIAGNOSTIC_QUESTIONS: ConsultorQuestion[] = [
  {
    id: 1,
    category: "canal",
    theme: "receita",
    question: "Hoje, qual é o modelo de receita predominante na sua consultoria?",
    levels: {
      "1": "100% projetos pontuais, sem recorrência",
      "2": "Maioria projetos, alguma receita esporádica recorrente",
      "3": "Mix equilibrado entre projetos e mensalidades",
      "4": "Maioria recorrente, projetos complementam",
      "5": "Receita previsível e recorrente é a base do negócio",
    },
  },
  {
    id: 2,
    category: "canal",
    theme: "capacidade",
    question: "Você tem equipe ou estrutura para atender mais clientes sem depender 100% do seu tempo?",
    levels: {
      "1": "Faço tudo sozinho, sou o único recurso",
      "2": "Tenho 1-2 pessoas mas ainda dependo muito de mim",
      "3": "Tenho equipe pequena que executa parte das entregas",
      "4": "Equipe estruturada, consigo delegar a maioria",
      "5": "Estrutura robusta, posso escalar sem gargalo pessoal",
    },
  },
  {
    id: 3,
    category: "canal",
    theme: "retencao",
    question: "Seus clientes costumam renovar contrato ou a maioria é projeto único?",
    levels: {
      "1": "Quase todos são projeto único, sem renovação",
      "2": "Poucos renovam, a maioria sai após a entrega",
      "3": "Cerca de metade renova ou continua",
      "4": "A maioria renova, churn é baixo",
      "5": "Retenção alta, clientes ficam anos comigo",
    },
  },
  {
    id: 4,
    category: "canal",
    theme: "digitalizacao",
    question: "Você já ajudou clientes a implantar algum software de gestão ou IA?",
    levels: {
      "1": "Nunca, meu trabalho é 100% consultivo/manual",
      "2": "Já indiquei ferramentas mas não implantei",
      "3": "Já implantei ferramentas simples (planilhas, Trello, etc.)",
      "4": "Implanto softwares de gestão como parte do serviço",
      "5": "Digitalização é core do meu serviço, inclui IA",
    },
  },
  {
    id: 5,
    category: "canal",
    theme: "whitelabel",
    question: "Você já revendeu algum produto ou serviço com sua própria marca?",
    levels: {
      "1": "Nunca, só vendo meu conhecimento",
      "2": "Já pensei nisso mas nunca fiz",
      "3": "Já revendi algo pontualmente",
      "4": "Tenho um produto parceiro que revendo com frequência",
      "5": "Tenho produto white label consolidado no portfólio",
    },
  },
  {
    id: 6,
    category: "canal",
    theme: "vendas",
    question: "Você tem um processo estruturado para prospectar e fechar novos clientes?",
    levels: {
      "1": "Dependo 100% de indicação, sem processo",
      "2": "Faço prospecção esporádica, sem rotina",
      "3": "Tenho algumas ações de captação mas sem processo claro",
      "4": "Processo definido com etapas e follow-up",
      "5": "Pipeline estruturado, previsível e com métricas",
    },
  },
  {
    id: 7,
    category: "canal",
    theme: "escalabilidade",
    question: "Você consegue atender mais clientes sem aumentar proporcionalmente suas horas de trabalho?",
    levels: {
      "1": "Não, cada cliente exige 100% do meu tempo",
      "2": "Pouco, ainda sou gargalo na maioria das entregas",
      "3": "Tenho algumas entregas padronizadas que escalam",
      "4": "Boa parte do serviço é escalável com templates e processos",
      "5": "Modelo altamente escalável, posso crescer sem limite de horas",
    },
  },
  {
    id: 8,
    category: "canal",
    theme: "ticket",
    question: "Qual o ticket médio mensal por cliente hoje?",
    levels: {
      "1": "Menos de R$ 500/mês",
      "2": "Entre R$ 500 e R$ 1.500/mês",
      "3": "Entre R$ 1.500 e R$ 3.000/mês",
      "4": "Entre R$ 3.000 e R$ 7.000/mês",
      "5": "Acima de R$ 7.000/mês",
    },
  },
  {
    id: 9,
    category: "canal",
    theme: "diferenciacao",
    question: "O que impede seus clientes de contratar um concorrente amanhã?",
    levels: {
      "1": "Nada, sou facilmente substituível",
      "2": "Relacionamento pessoal, mas sem diferencial técnico",
      "3": "Tenho especialização no setor do cliente",
      "4": "Entrego resultado mensurável que gera dependência positiva",
      "5": "Tenho metodologia + tecnologia própria que ninguém replica",
    },
  },
  {
    id: 10,
    category: "canal",
    theme: "visao",
    question: "Se pudesse agregar um produto de tecnologia ao seu portfólio com sua marca, isso faria sentido no seu modelo?",
    levels: {
      "1": "Não faz sentido, meu modelo é só consultivo",
      "2": "Talvez, mas não sei como operacionalizar",
      "3": "Sim, já estou buscando algo assim",
      "4": "Sim, seria um diferencial competitivo forte",
      "5": "É exatamente o que falta pra eu escalar",
    },
  },
];
