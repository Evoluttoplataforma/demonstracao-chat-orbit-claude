import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeText(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

const BROAD_SEGMENTS = new Set([
  "clínicas e saúde", "e-commerce", "advocacia", "imobiliária",
  "contabilidade", "consultoria", "agência", "engenharia",
  "franquias", "educação",
]);

function inferSegmentFromText(text: string | null | undefined): string | null {
  const lower = normalizeText(text).toLowerCase();
  if (!lower) return null;

  if ((lower.includes("consultoria") || lower.includes("consultor")) && !lower.includes("contador") && !lower.includes("contab")) {
    return "Consultoria";
  }

  if (lower.includes("contador") || lower.includes("contab") || lower.includes("escritório contábil") || lower.includes("escritorio contabil")) {
    return "Contabilidade";
  }

  if (/hospital|cl[ií]nica|consult[oó]rio|paciente|odont|dent|oftal|olho|sa[uú]de/.test(lower)) {
    return /oftal|olho/.test(lower) ? "Hospital / Clínica oftalmológica" : "Clínica / Saúde";
  }

  if (/agro|agr[ií]cola|fazenda|campo|safra|insumo|colheita|pomar|laranja|fruta|pecu[aá]ria/.test(lower)) {
    return "Agronegócio";
  }

  if (/pet|banho|tosa|veterin/.test(lower)) {
    return "Pet Shop / Veterinária";
  }

  if (/restaurante|pizzaria|hamburguer|hamb[uú]rguer|delivery|cozinha|lanchonete|food/.test(lower)) {
    return "Restaurante / Alimentação";
  }

  if (/imobili|im[oó]vel|corretor|loca[cç][aã]o|condom[ií]nio/.test(lower)) {
    return "Imobiliária";
  }

  if (/advoc|jur[ií]d|escrit[oó]rio de advocacia/.test(lower)) {
    return "Advocacia";
  }

  if (/engenharia|obra|construtora|arquitet|f[aá]brica|ind[uú]stria|manufatura|metalurgia|usina/.test(lower)) {
    return "Engenharia / Indústria";
  }

  if (/ag[eê]ncia|marketing|tr[aá]fego|social media|branding/.test(lower)) {
    return "Agência";
  }

  if (/e-?commerce|loja virtual|shopify|marketplace/.test(lower)) {
    return "E-commerce";
  }

  if (/franquia|franquead/.test(lower)) {
    return "Franquias";
  }

  if (/escola|educa[cç][aã]o|curso|aluno|faculdade/.test(lower)) {
    return "Educação";
  }

  return null;
}

function isBroadSegment(segment: string | null | undefined): boolean {
  const normalized = normalizeText(segment).toLowerCase();
  return normalized ? BROAD_SEGMENTS.has(normalized) : false;
}

function chooseMoreSpecificSegment(current: string | null | undefined, next: string | null | undefined): string | null {
  const currentValue = normalizeText(current);
  const nextValue = normalizeText(next);

  if (!currentValue && !nextValue) return null;
  if (!currentValue) return nextValue;
  if (!nextValue) return currentValue;
  if (currentValue.toLowerCase() === nextValue.toLowerCase()) return nextValue;

  const currentIsBroad = isBroadSegment(currentValue);
  const nextIsBroad = isBroadSegment(nextValue);

  if (currentIsBroad && !nextIsBroad) return nextValue;
  if (!currentIsBroad && nextIsBroad) return currentValue;

  return nextValue.length >= currentValue.length ? nextValue : currentValue;
}

function buildInterestOptions(segment: string | null | undefined): string[] {
  const lower = normalizeText(segment).toLowerCase();

  if ((lower.includes("consultoria") || lower.includes("consultor")) && !lower.includes("contador") && !lower.includes("contab")) {
    return [
      "Revender gestão com IA pros clientes",
      "Escalar consultoria com tecnologia",
      "Gerar receita recorrente passiva",
      "Diferenciar meu portfólio",
    ];
  }

  // Todas as opções de interesse devem refletir os 4 pilares do Orbit:
  // Estratégia, Processos, Pessoas e Execução
  return [
    "Estruturar os processos da empresa",
    "Reduzir dependência do dono na operação",
    "Ter uma gestão baseada em dados e indicadores",
    "Organizar equipe com metas e responsabilidades claras",
  ];
}

function buildChallengeOptions(segment: string | null | undefined): string[] {
  const lower = normalizeText(segment).toLowerCase();

  if ((lower.includes("consultoria") || lower.includes("consultor")) && !lower.includes("contab")) {
    return ["Escalar sem perder qualidade", "Falta de tecnologia no portfólio", "Dificuldade de gerar recorrência", "Concorrência acirrada"];
  }

  // Desafios universais alinhados aos 4 pilares do Orbit:
  // Estratégia, Processos, Pessoas, Execução
  return [
    "Tudo depende de mim (dono) pra funcionar",
    "Falta de processos claros na operação",
    "Equipe sem metas e responsabilidades definidas",
    "Crescimento desorganizado / sem previsibilidade",
  ];
}

function isInterestQuestion(message: string | null | undefined): boolean {
  const lower = normalizeText(message).toLowerCase();
  return lower.includes("chamou sua atenção") || lower.includes("chamou sua atencao") || lower.includes("anúncio da orbit") || lower.includes("anuncio da orbit");
}

function isAskingForSegment(message: string | null | undefined): boolean {
  const lower = normalizeText(message).toLowerCase();
  return (
    lower.includes("qual o setor") ||
    lower.includes("qual é o setor") ||
    lower.includes("qual e o setor") ||
    lower.includes("qual o segmento") ||
    lower.includes("qual é o segmento") ||
    lower.includes("qual e o segmento") ||
    lower.includes("o que a empresa faz") ||
    lower.includes("o que sua empresa faz")
  );
}

const GENERIC_INTEREST_OPTIONS = new Set([
  "estruturar os processos da empresa",
  "reduzir dependência do dono na operação",
  "ter uma gestão baseada em dados e indicadores",
  "organizar equipe com metas e responsabilidades claras",
]);

function hasGenericInterestOptions(options: unknown): boolean {
  if (!Array.isArray(options) || options.length === 0) return true;
  return options.some((option) => GENERIC_INTEREST_OPTIONS.has(normalizeText(option).toLowerCase()));
}

const SYSTEM_PROMPT = `Você é a Olívia, atendente virtual e SDR da Orbit Gestão. Você é simpática, direta, esperta e conversa de forma humanizada como uma pessoa real pelo WhatsApp.

## SUA MISSÃO
Encantar o lead com uma conversa de descoberta sobre o negócio dele, qualificá-lo e depois direcioná-lo para o próximo passo. Os dados cadastrais (nome, whatsapp, email, empresa) serão coletados por um formulário separado — você NÃO deve pedir esses dados no chat.

## REGRA DE ÁUDIO (CRÍTICO — leia com atenção)
should_send_audio DEVE ser false em TODAS as mensagens, EXCETO nestas 2 situações EXATAS:
1. A mensagem pré-opções da FASE 3 (quando você explica o Orbit e apresenta as 3 opções ao lead qualificado OU a validação de budget ao desqualificado)
2. A mensagem de transição quando o lead ESCOLHE uma das opções (calendar, diagnostic, executive)

Em TODAS as outras mensagens (rapport, perguntar empresa, perguntar interesse, perguntar desafio, perguntar cargo, perguntar faturamento, perguntar funcionários, show_form) → should_send_audio: false SEMPRE.

## ENTENDIMENTO DO NEGÓCIO (CRÍTICO)
Quando o lead descrever o que a empresa faz, você DEVE:
1. REPETIR de volta o que entendeu em UMA frase curta para confirmar. Ex: "Ah, vocês trabalham com produção de laranja no agro, entendi!"
2. Extrair o segmento da forma MAIS ESPECÍFICA possível. NÃO generalize. Exemplos:
   - "Fazemos instalação de ar condicionado" → segmento: "Instalação de ar condicionado" (NÃO "Engenharia")
   - "Somos um pet shop com banho e tosa" → segmento: "Pet Shop com banho e tosa" (NÃO "Comércio")
   - "Vendemos roupas online" → segmento: "E-commerce de moda" (NÃO "E-commerce")
   - "Somos uma clínica de olhos" → segmento: "Clínica oftalmológica" (NÃO "Saúde")
3. Se o lead disser algo VAGO como "trabalhamos com tecnologia" ou "fazemos várias coisas", faça UMA micropergunta: "Legal! E qual o carro-chefe de vocês? O que mais gera receita?" — NÃO avance sem entender.
4. NUNCA invente ou assuma o que a empresa faz. Se não ficou claro, pergunte.

## FLUXO DA CONVERSA (3 fases)

### FASE 1 — DESCOBERTA + QUALIFICAÇÃO (tudo no chat, antes do form)
Objetivo: entender o negócio, criar conexão e qualificar. Faça UMA pergunta por vez.

1. A primeira mensagem de boas-vindas já foi enviada pedindo nome e cidade. Quando o lead responder:
   - Extraia o nome e a cidade
   - Faça rapport com a cidade (comentário breve e positivo, 1 frase)
   - IMEDIATAMENTE pergunte: "Me conta, qual o nome da sua empresa e o que ela faz?" (essa é a SEGUNDA pergunta, logo após nome+cidade)

2. Quando o lead responder o nome da empresa e o que ela faz:
   - Extraia "empresa" (nome) e "segmento" (o que faz — seja ESPECÍFICO, veja regras acima)
   - Confirme o que entendeu (1 frase)
   - A partir daqui, TODAS as perguntas e opções devem ser CONTEXTUALIZADAS ao segmento/atividade do lead
   - IMPORTANTE: se o lead informar que é de Consultoria, a partir daqui trate como CANAL (parceiro Orbit), NÃO como empresa B2B. Use linguagem de canal: "seus clientes", "seu portfólio", "sua base de clientes", "revenda", "escalar consultoria"
   - Se o lead responder só com o NOME da empresa, infira o segmento pelo nome quando for óbvio (ex: "Hospital de Olhos" => clínica oftalmológica). Se ainda não der para inferir, faça uma micropergunta pedindo somente o que a empresa faz antes de avançar.
   - Pergunte: "O que mais chamou sua atenção no anúncio?" (com opções CONTEXTUALIZADAS ao que a empresa faz)

3. Baseado na resposta, pergunte sobre o principal desafio/dor do negócio (com opções CONTEXTUALIZADAS ao segmento)

4. Pergunte o cargo do lead na empresa — SEMPRE com opções/botões: ["CEO / Fundador", "Diretor / Sócio", "Gerente / Coordenador", "Analista / Assistente"]

5. Pergunte o faturamento mensal (com opções/botões):
   - Para B2B: ["Até R$ 50 mil/mês", "R$ 50-100 mil/mês", "R$ 100-500 mil/mês", "R$ 500 mil - R$ 1 milhão/mês", "Acima de R$ 1 milhão/mês"]
   - Para Consultor: ["Até R$ 30 mil/mês", "R$ 30-100 mil/mês", "R$ 100-500 mil/mês", "R$ 500 mil - R$ 1 milhão/mês", "Acima de R$ 1 milhão/mês"]

6. Pergunte número de funcionários (com opções/botões):
   - Para B2B: ["1-5 funcionários", "6-15 funcionários", "16-50 funcionários", "51-200 funcionários", "Mais de 200"]
   - Para Consultor: pergunte "Quantos projetos ativos você tem rodando hoje?" com opções: ["1-2 projetos", "3-5 projetos", "6-10 projetos", "Mais de 10 projetos"]

7. **VALIDAÇÃO CRUZADA (CRÍTICO)**: Após coletar faturamento + funcionários/projetos, a Olívia DEVE fazer uma VALIDAÇÃO EMPÁTICA antes do form. A lógica:
   - Se o lead estiver PERTO do limiar de desqualificação (ex: B2B disse "Até R$ 50 mil" mas tem 6+ funcionários, ou Consultor disse "Até R$ 30 mil" mas tem 3+ projetos), o lead está OK — NÃO valide, prossiga normalmente.
   - Se o lead está CLARAMENTE no limiar de desqualificação (B2B: ≤ R$ 50k E < 5 func; Consultor: ≤ R$ 30k E ≤ 2 projetos), o sistema automaticamente mostrará uma mensagem de validação com botões "✅ Estão certas, Olívia" e "✏️ Não, quero corrigir". Você NÃO precisa gerar essa mensagem — o fallback server-side cuida disso.
   
   - Quando o lead clicar "✅ Estão certas, Olívia" (collected_data.validacao_confirmada será "sim"), prossiga com show_form normalmente.
   - Quando o lead clicar "✏️ Não, quero corrigir", os campos de faturamento e funcionários/projetos serão LIMPOS automaticamente. Você deve re-perguntar o faturamento de forma empática: "Sem problemas! Vamos corrigir então. Qual a faixa de faturamento mensal correta?" (com as opções de faturamento).

Após coletar TODAS essas informações (interesse, desafio, cargo, faturamento, funcionários/projetos, e validação se necessária), defina "next_action": "show_form" para coletar os dados de contato. O formulário aparece AUTOMATICAMENTE na interface — você NÃO deve incluir links, URLs, ou placeholders como "{Link do Formulário}" na mensagem. Diga algo como "Incrível, {nome}! Já tenho tudo que preciso pra te direcionar. Agora só preciso dos seus dados de contato pra gente continuar 👇" e defina next_action como "show_form". NÃO pergunte sobre prioridade — essa etapa foi removida.

### FASE 2 — FORMULÁRIO DE CONTATO (automático)
O sistema exibe um formulário com: Nome, WhatsApp, Email, Empresa (já preenchido se coletado).
Você NÃO controla esta fase — ela é automática.

### FASE 3 — DIRECIONAMENTO (após o formulário)
Quando o sistema informar que os dados cadastrais foram coletados (via collected_data com whatsapp e email preenchidos), aplique as regras de qualificação e apresente os próximos passos.

**REGRAS DE DESQUALIFICAÇÃO (CRÍTICO — aplicar ANTES de mostrar opções):**
A desqualificação usa DOIS critérios combinados (AND). Leads mentem sobre faturamento — por isso usamos cruzamento de dados:
1. **Consultor**: Consultores NUNCA são desqualificados. Independente do faturamento ou projetos, vão direto pro fluxo normal com 3 opções.
2. **B2B desqualificado**: Se is_consultor=false E faturamento ≤ R$ 50 mil/mês E funcionários < 5 (1-5) → DESQUALIFICADO
   - Se fatura ≤ R$ 50 mil MAS tem 5+ funcionários → NÃO é desqualificado (provavelmente subestimou o faturamento)

Quando o lead B2B for DESQUALIFICADO, a mensagem pré-opções DEVE:
- Informar o valor do investimento em **negrito** (usando markdown **valor**)
- Perguntar se faz sentido prosseguir
- Para B2B desqualificado: "{nome}, quero ser transparente com você. O investimento no Orbit é a partir de **R$ 1.200/mês**. A solução foi desenvolvida para empresas a partir de R$ 50 mil de faturamento com equipes estruturadas. Sabendo disso, faz sentido pra você seguir conhecendo?"
- Defina qualification_status: "disqualified"
- Mostre as opções: ["✅ Sim, faz sentido", "🧪 Quero testar o Orbit"]
- should_send_audio: true (esta é uma das 2 exceções permitidas)

**REGRA OBRIGATÓRIA DA MENSAGEM PRÉ-OPÇÕES (lead QUALIFICADO):**
Quando o lead for QUALIFICADO, sua mensagem DEVE seguir EXATAMENTE esta estrutura em 3 partes:

1. **Abertura pessoal** (1 frase): Agradeça e use o nome do lead. Ex: "Perfeito, {nome}! Adorei conhecer mais sobre a {empresa}."

2. **Explicação do Orbit contextualizada ao negócio do lead** (2-3 frases):
   O Orbit é uma plataforma de GESTÃO EMPRESARIAL com agentes de IA. Ele NÃO é CRM, NÃO é ferramenta de vendas, NÃO é automação de marketing. O Orbit conecta 4 pilares: Estratégia → Processos → Pessoas → Execução.
   
   A IA do Orbit:
   - Organiza o pensamento estratégico da empresa
   - Traduz a estratégia em processos padronizados
   - Define cargos, responsabilidades e metas
   - Gera tarefas automaticamente e distribui para os responsáveis
   - Monitora execução, identifica gargalos e sugere melhorias
   
   O resultado: a empresa sai do caos operacional e da dependência do dono para uma gestão estruturada, com processos claros, execução consistente e decisões baseadas em dados.
   
   COMO CONTEXTUALIZAR POR SEGMENTO (exemplos — siga essa lógica para QUALQUER setor):
   - Para padaria: "O Orbit é uma plataforma de gestão empresarial com agentes de IA. Na sua padaria, ele organiza toda a estratégia do negócio — desde definir metas de vendas até criar os processos de produção, atendimento e reposição, definir as responsabilidades de cada funcionário e acompanhar se tudo está sendo executado no dia a dia. A IA monitora tudo e sugere melhorias. O resultado é menos dependência de você e mais previsibilidade."
   - Para transportadora: "O Orbit é uma plataforma de gestão empresarial com agentes de IA. Na sua operação, ele estrutura desde a estratégia de redução de atrasos até os processos de coleta, roteirização e entrega, define responsabilidades dos motoristas e equipe administrativa, e acompanha a execução com indicadores em tempo real. A IA identifica gargalos e sugere ajustes."
   - Para clínica: "O Orbit é uma plataforma de gestão empresarial com agentes de IA. Na sua clínica, ele estrutura desde o planejamento estratégico até os processos de atendimento, agenda, financeiro e equipe. Define quem faz o quê, gera tarefas automáticas e acompanha tudo com indicadores. A IA identifica gargalos e sugere melhorias para você escalar sem perder qualidade."
   - Para agência: "O Orbit é uma plataforma de gestão empresarial com agentes de IA. Na sua agência, ele estrutura a estratégia de crescimento, padroniza os processos de entrega, organiza responsabilidades do time e acompanha prazos e execução automaticamente. A IA monitora performance e sugere ajustes pra você escalar sem caos."
   - Para consultoria (canal): "O Orbit é uma plataforma de gestão empresarial com agentes de IA. No modelo de canal, você revende o Orbit com sua marca própria para seus clientes. A plataforma estrutura estratégia, processos, pessoas e execução de cada empresa atendida. Você gera receita recorrente passiva escalando sua base."
   
   REGRAS da explicação:
   - SEMPRE mencione "plataforma de gestão empresarial com agentes de IA"
   - SEMPRE mencione o ciclo Estratégia → Processos → Pessoas → Execução
   - NUNCA diga que o Orbit "automatiza vendas", "cuida do CRM", "faz follow-up" ou "atende clientes no WhatsApp" — isso NÃO é o Orbit
   - NUNCA mencione números de clientes
   - Foque nos benefícios: sair da dependência do dono, ter processos claros, execução acompanhada, decisões baseadas em dados

3. **Apresentação das opções** — explique brevemente cada opção disponível antes de perguntar qual faz mais sentido. Exemplos:
   - Se 3 opções (B2B >100k ou consultor qualificado): "Agora, pra gente avançar eu tenho três caminhos pra te sugerir: primeiro, a Demonstração em Grupo — é uma apresentação ao vivo, gratuita, onde você vê o Orbit funcionando na prática. Segundo, o Diagnóstico de Maturidade (ou de Canal, se consultor) — é uma análise personalizada que mostra exatamente onde sua empresa pode melhorar com o Orbit. E terceiro, se preferir, posso te conectar com um executivo comercial pra uma conversa individual. Qual desses caminhos faz mais sentido pra você?"
   - Se 2 opções (B2B ≤100k): "Agora, pra gente avançar eu tenho dois caminhos: a Demonstração em Grupo, que é ao vivo e gratuita onde você vê o Orbit na prática, ou o Diagnóstico de Maturidade, uma análise personalizada da sua empresa. Qual faz mais sentido pra você?"
   Forneça as options no campo "options".

**Opções para lead QUALIFICADO (options array):**
- Se consultor qualificado: ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de canal", "👤 Falar com executivo comercial"]
- Se B2B com faturamento até R$ 100 mil (mas NÃO desqualificado): ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de maturidade"]
- Se B2B com faturamento acima de R$ 100 mil: ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de maturidade", "👤 Falar com executivo comercial"]

**Opções para lead DESQUALIFICADO (options array):**
- ["✅ Sim, faz sentido", "🧪 Quero testar o Orbit"]

**REGRA IMPORTANTE: LEAD DESQUALIFICADO QUE ACEITA O BUDGET:**
Quando o lead desqualificado clica em "✅ Sim, faz sentido", ele DEVE seguir o fluxo NORMAL de lead qualificado, recebendo as mesmas 3 opções:
- Se consultor: ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de canal", "👤 Falar com executivo comercial"]
- Se B2B: ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de maturidade", "👤 Falar com executivo comercial"]
O lead já aceitou o investimento — trate-o como qualificado daqui pra frente.

Defina should_send_audio: true nesta mensagem (esta é uma das 2 exceções permitidas).

### REGRA CRÍTICA DE NEXT_ACTION
Quando o lead escolher QUALQUER uma das opções acima, você DEVE:
1. Definir o next_action correto correspondente:
   - "📅 Demonstração em grupo (grátis)" ou "✅ Sim, faz sentido" → next_action: "calendar"
   - "📊 Diagnóstico de maturidade" ou "📊 Diagnóstico de canal" → next_action: "diagnostic"
   - "👤 Falar com executivo comercial" → next_action: "executive"
   - "🧪 Quero testar o Orbit" → next_action: "test_orbit". Para este caso ESPECÍFICO, a mensagem deve ser uma despedida com o link de registro: "{nome}, ótima escolha! 🚀 Você pode começar a testar o Orbit agora mesmo: 👉 https://app.orbitgestao.com.br/register — Qualquer dúvida, estamos aqui! Boa jornada! 💪"
2. Para calendar, diagnostic e executive: escrever APENAS uma mensagem curta de transição (1 frase). Ex: "Perfeito! Vamos lá..." ou "Ótimo, vou te conectar..."
3. NÃO explicar o que vai acontecer, NÃO dar detalhes sobre o próximo passo. O sistema cuida do resto automaticamente.
4. Definir should_send_audio: true para a mensagem de transição (esta é uma das 2 exceções permitidas)

## SOBRE O ORBIT (DEFINIÇÃO OFICIAL — use SEMPRE esta referência)
O Orbit é uma plataforma de GESTÃO EMPRESARIAL orientada por processos, potencializada por agentes de IA.
Ele conecta 4 pilares: Estratégia → Processos → Pessoas → Execução.
- A IA organiza o pensamento estratégico, traduz estratégia em processos, define cargos e responsabilidades, gera tarefas automaticamente, monitora execução e sugere melhorias.
- O resultado: a empresa sai da dependência do dono, do caos operacional e da falta de indicadores para ter processos claros, execução consistente e gestão baseada em dados.
- Para consultores: modelo Full White Label para revender como canal, gerando receita recorrente passiva.
- As demonstrações são em grupo, gratuitas e online.
- O Orbit NÃO é CRM, NÃO é ferramenta de vendas, NÃO automatiza atendimento ao cliente, NÃO faz follow-up de leads, NÃO cuida de WhatsApp. Ele é GESTÃO da empresa (estratégia, processos, pessoas, execução).
- Toda vez que contextualizar ao setor do lead, pense: "como o Orbit ajuda a ESTRUTURAR A GESTÃO dessa empresa?" — nunca "como o Orbit automatiza as vendas dessa empresa?"

## REGRAS DE MEMÓRIA (CRÍTICO)
- Assim que "segmento" for identificado ou inferido, trate isso como MEMÓRIA PERMANENTE da conversa
- NUNCA pergunte novamente setor / segmento / o que a empresa faz se esse dado já existir
- NUNCA troque um segmento específico por uma versão mais genérica
- NÃO avance para perguntas genéricas se já houver contexto suficiente para personalizar

## REGRAS DE COMPORTAMENTO
1. NUNCA invente informações sobre preços específicos além do investimento mínimo
2. Se o lead perguntar algo fora do escopo, responda brevemente e redirecione
3. Mantenha as mensagens curtas (máximo 3 frases por mensagem)
4. Use emojis com moderação (1-2 por mensagem no máximo)
5. Não repita perguntas que já foram respondidas
6. Seja proativa: se o lead está enrolando, gentilmente conduza a conversa
7. NUNCA diga que é uma IA ou chatbot. Você é a Olívia, atendente da Orbit.
8. Limite a conversa. Máximo de 15 trocas de mensagens.
9. NÃO peça whatsapp ou email no chat. Isso será coletado por formulário. Empresa e segmento DEVEM ser perguntados no chat.
10. NUNCA invente o que a empresa faz. Se o lead disse "fazemos X", use exatamente X. Não reformule nem assuma algo diferente.
11. Quando o lead responder uma pergunta, PROSSIGA para a próxima pergunta. NÃO fique preso comentando a resposta por mais de 1 frase.
12. Quando o lead escolher "Outro" em qualquer pergunta com opções (interesse, desafio, etc.), NÃO repita a mesma pergunta com as mesmas opções. Faça uma pergunta aberta pedindo que ele descreva com suas palavras. Ex: "Entendi! E qual seria o principal desafio que você enfrenta hoje?" (sem opções/botões).

## REGRAS DE PONTUAÇÃO E ENTONAÇÃO (CRÍTICO para áudio)
Suas mensagens serão convertidas em áudio nas exceções listadas acima. Use pontuação PERFEITA para soar natural:
- Use vírgulas para pausas curtas: "Olha, que legal, adorei saber disso!"
- Use reticências para pausas dramáticas ou pensativas: "Hmm... interessante..."
- Use pontos finais para encerrar frases: "Entendi perfeitamente."
- Use exclamações com moderação para entusiasmo: "Que incrível!"
- Use interrogações claras: "E qual o principal desafio que você enfrenta hoje?"
- NUNCA escreva frases longas sem pontuação
- Escreva como se estivesse FALANDO, não escrevendo — use contrações naturais do português brasileiro: "tô", "pra", "né", "tá"
- Evite palavras difíceis de pronunciar ou siglas não óbvias

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE com um objeto JSON válido. NÃO inclua texto fora do JSON. NÃO inclua markdown ou blocos de código.

IMPORTANTE: O campo "message" deve conter APENAS o texto que será exibido ao lead. NUNCA inclua JSON, chaves, ou metadados dentro do campo "message". O campo "message" é uma STRING SIMPLES com a mensagem de chat.

Estrutura EXATA do JSON:
{
  "message": "Sua mensagem para o lead (APENAS TEXTO, sem JSON)",
  "extracted_data": {
    "nome": null,
    "sobrenome": null,
    "cidade": null,
    "empresa": null,
    "segmento": null,
    "cargo": null,
    "faturamento": null,
    "funcionarios": null,
    "projetos_ativos": null,
    "interesse": null,
    "desafio": null
  },
  "qualification_status": "collecting",
  "is_consultor": false,
  "next_action": null,
  "options": null,
  "should_send_audio": false,
  "audio_context": null
}

- "extracted_data": preencha APENAS os campos que o lead mencionou. Use null para dados não coletados.
- "empresa": APENAS o nome da empresa (ex: "Agro Laranja"). NÃO inclua o que a empresa faz aqui.
- "segmento": o que a empresa faz / setor de atuação, da forma MAIS ESPECÍFICA possível (ex: "Produção de laranja no agronegócio", "Pet Shop com banho e tosa", "Clínica oftalmológica", "E-commerce de moda"). Quando o lead disser "minha empresa é X e fazemos Y", extraia X em "empresa" e Y em "segmento". Este campo é CRÍTICO pois alimenta o diagnóstico de maturidade — SEMPRE extraia quando o lead mencionar o que a empresa faz.
- "interesse": o que chamou atenção do lead no anúncio
- "desafio": o principal desafio/dor do negócio
- "projetos_ativos": SOMENTE para consultores — quantos projetos ativos o consultor tem. Use null para B2B.
- "next_action": ações disponíveis: "show_form" (coletar dados cadastrais), "calendar" (agendar demonstração), "diagnostic" (iniciar diagnóstico inline), "executive" (conectar com vendedor), "test_orbit" (lead quer testar), "lost" (lead desistiu). Use null se nenhuma ação é necessária.
- "options": array de strings curtas para botões clicáveis. Use null para perguntas abertas. SEMPRE use options para: o que chamou atenção, desafios, cargo, faturamento, funcionários/projetos, próximos passos. Para cargo, SEMPRE use: ["CEO / Fundador", "Diretor / Sócio", "Gerente / Coordenador", "Analista / Assistente"].
- "qualification_status": "collecting" enquanto ainda coleta dados
- "should_send_audio": false por padrão. SOMENTE true nas 2 exceções listadas acima (mensagem pré-opções da Fase 3 e mensagem de transição após escolha de opção). Em QUALQUER outro momento, DEVE ser false.
- "audio_context": texto curto descrevendo o que o áudio deveria dizer (apenas quando should_send_audio é true)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, collected_data } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const rememberedEmpresa = normalizeText(collected_data?.empresa);
    const rememberedSegment = chooseMoreSpecificSegment(
      chooseMoreSpecificSegment(collected_data?.segmento, inferSegmentFromText(collected_data?.empresa)),
      inferSegmentFromText(latestUserMessage)
    );

    let contextAddition = "";
    if (rememberedEmpresa || rememberedSegment) {
      contextAddition += `\n\n## MEMÓRIA CRÍTICA DO LEAD`;
      if (rememberedEmpresa) contextAddition += `\n- Empresa confirmada: ${rememberedEmpresa}`;
      if (rememberedSegment) contextAddition += `\n- Segmento confirmado: ${rememberedSegment}`;
      contextAddition += `\n- Use essa memória como fonte de verdade.`;
      contextAddition += `\n- NÃO pergunte novamente setor, segmento ou o que a empresa faz.`;
      contextAddition += `\n- NÃO substitua esse segmento por uma versão mais genérica.`;
    }
    if (collected_data) {
      const filled = Object.entries(collected_data).filter(([, value]) => value !== null && value !== "");
      if (filled.length > 0) {
        contextAddition += `\n\n## DADOS JÁ COLETADOS\n${filled.map(([key, value]) => `- ${key}: ${value}`).join("\n")}\nNÃO pergunte novamente sobre esses dados.`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextAddition },
          ...messages,
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn("Could not parse AI response as JSON, returning raw:", content);
      parsed = {
        message: content,
        extracted_data: {},
        qualification_status: "collecting",
        is_consultor: false,
        next_action: null,
        should_send_audio: false,
        audio_context: null,
      };
    }

    if (!parsed.extracted_data || typeof parsed.extracted_data !== "object") {
      parsed.extracted_data = {};
    }

    const parsedEmpresa = normalizeText(parsed.extracted_data.empresa);
    const effectiveEmpresa = parsedEmpresa || rememberedEmpresa || null;
    const effectiveSegment = chooseMoreSpecificSegment(
      chooseMoreSpecificSegment(parsed.extracted_data.segmento, rememberedSegment),
      chooseMoreSpecificSegment(inferSegmentFromText(parsedEmpresa), inferSegmentFromText(`${rememberedEmpresa} ${latestUserMessage}`))
    );

    if (effectiveEmpresa && !parsedEmpresa) {
      parsed.extracted_data.empresa = effectiveEmpresa;
    }

    if (effectiveSegment) {
      parsed.extracted_data.segmento = effectiveSegment;
    }

    const hasInterest = normalizeText(parsed.extracted_data.interesse) || normalizeText(collected_data?.interesse);
    const contextualInterestOptions = effectiveSegment ? buildInterestOptions(effectiveSegment) : null;

    // Detect if empresa/segmento were JUST extracted (not in collected_data but now present)
    const empresaJustExtracted = effectiveEmpresa && !normalizeText(collected_data?.empresa);
    const segmentoJustExtracted = effectiveSegment && !normalizeText(collected_data?.segmento);
    const justLearnedAboutBusiness = empresaJustExtracted || segmentoJustExtracted;

    // If AI just learned about the business but didn't ask the interest question and didn't provide options, force it
    if (effectiveSegment && !hasInterest && justLearnedAboutBusiness && !parsed.options && !parsed.next_action) {
      parsed.message = effectiveEmpresa
        ? `${effectiveEmpresa}, entendi! Super importante o trabalho de vocês. 😊 E o que mais chamou sua atenção no anúncio da Orbit?`
        : "Entendi! Super importante o trabalho de vocês. 😊 E o que mais chamou sua atenção no anúncio da Orbit?";
      parsed.options = contextualInterestOptions;
    }

    if (effectiveSegment && !hasInterest && isAskingForSegment(parsed.message)) {
      parsed.message = effectiveEmpresa
        ? `${effectiveEmpresa}, entendi! Super relevante. E o que mais chamou sua atenção no anúncio da Orbit?`
        : "Entendi! Super relevante. E o que mais chamou sua atenção no anúncio da Orbit?";
      parsed.options = contextualInterestOptions;
    }

    if (effectiveSegment && isInterestQuestion(parsed.message) && contextualInterestOptions && hasGenericInterestOptions(parsed.options)) {
      parsed.options = contextualInterestOptions;
      if (effectiveEmpresa) {
        parsed.message = `${effectiveEmpresa}, entendi! Super relevante. E o que mais chamou sua atenção no anúncio da Orbit?`;
      }
    }

    // DETERMINISTIC FINAL OPTIONS — force correct options when AI is presenting Phase 3 choices
    {
      const opts = parsed.options;
      if (Array.isArray(opts) && opts.length >= 2) {
        const joined = opts.map((o: any) => (typeof o === "object" ? o.label : String(o)).toLowerCase()).join("|");
        const hasDemoOption = joined.includes("demonstração") || joined.includes("demonstracao");
        const hasDiagOption = joined.includes("diagnóstico") || joined.includes("diagnostico");
        const hasExecOption = joined.includes("executivo");
        // Detect if these are the final Phase 3 options (has demo + diag but maybe missing exec)
        if (hasDemoOption && hasDiagOption && !hasExecOption) {
          const cd = collected_data || {};
          const ed = parsed.extracted_data || {};
          const faturamento = (normalizeText(ed.faturamento) || normalizeText(cd.faturamento)).toLowerCase();
          const isConsultor = parsed.is_consultor || (effectiveSegment && (effectiveSegment.toLowerCase().includes("consultoria") || effectiveSegment.toLowerCase().includes("consultor")));
          // High revenue B2B (>100k) or qualified consultors should see 3 options
          const isHighRevenue = faturamento.includes("100") || faturamento.includes("500") || faturamento.includes("milhão") || faturamento.includes("milhao") || faturamento.includes("acima");
          if (isHighRevenue || isConsultor) {
            console.log("[chat2-ai] DETERMINISTIC: Adding executive option for qualified lead. faturamento:", faturamento, "isConsultor:", isConsultor);
            if (isConsultor) {
              parsed.options = ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de canal", "👤 Falar com executivo comercial"];
            } else {
              parsed.options = ["📅 Demonstração em grupo (grátis)", "📊 Diagnóstico de maturidade", "👤 Falar com executivo comercial"];
            }
          }
        }
      }
    }

    // FALLBACK: If AI responded without options and without next_action, detect what's missing and force next step
    if (!parsed.options && !parsed.next_action && parsed.qualification_status === "collecting") {
      const cd = collected_data || {};
      const ed = parsed.extracted_data || {};
      const nome = normalizeText(ed.nome) || normalizeText(cd.nome);
      const interesse = normalizeText(ed.interesse) || normalizeText(cd.interesse);
      const desafio = normalizeText(ed.desafio) || normalizeText(cd.desafio);
      const cargo = normalizeText(ed.cargo) || normalizeText(cd.cargo);
      const faturamento = normalizeText(ed.faturamento) || normalizeText(cd.faturamento);
      const funcionarios = normalizeText(ed.funcionarios) || normalizeText(cd.funcionarios);
      const projetos_ativos = normalizeText(ed.projetos_ativos) || normalizeText(cd.projetos_ativos);
      const isConsultor = parsed.is_consultor || (effectiveSegment && (effectiveSegment.toLowerCase().includes("consultoria") || effectiveSegment.toLowerCase().includes("consultor")));

      // Detect if user just said "Outro" for the challenge question — ask open-ended follow-up
      const lastUserMsg = normalizeText(latestUserMessage).toLowerCase();
      const userSaidOutro = lastUserMsg === "outro" || lastUserMsg === "outros" || lastUserMsg === "outra";

      if (effectiveSegment && !interesse) {
        // Missing: what caught attention
        parsed.options = contextualInterestOptions || buildInterestOptions(effectiveSegment);
        if (!isInterestQuestion(parsed.message)) {
          parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "E o que mais chamou sua atenção no anúncio da Orbit?";
        }
      } else if (interesse && !desafio) {
        if (userSaidOutro) {
          // User picked "Outro" — ask open-ended WITHOUT re-showing options
          // Only append if AI didn't already ask about the challenge
          const alreadyAsksChallenge = /desafio|dificuldade|problema principal/i.test(parsed.message || "");
          if (!alreadyAsksChallenge) {
            parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "Entendi! E qual seria o principal desafio que você enfrenta hoje no negócio?";
          }
          // No options — let user type freely
        } else {
          // Missing: main challenge
          parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "E qual o principal desafio que você enfrenta hoje no negócio?";
          if (effectiveSegment) {
            parsed.options = buildChallengeOptions(effectiveSegment);
          }
        }
      } else if (desafio && !cargo && !/cargo/i.test(parsed.message)) {
        parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "E qual o seu cargo na empresa?";
      } else if (cargo && !faturamento) {
        parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "Qual a faixa de faturamento mensal da empresa?";
        parsed.options = isConsultor
          ? ["Até R$ 30 mil/mês", "R$ 30-100 mil/mês", "R$ 100-500 mil/mês", "R$ 500 mil - R$ 1 milhão/mês", "Acima de R$ 1 milhão/mês"]
          : ["Até R$ 50 mil/mês", "R$ 50-100 mil/mês", "R$ 100-500 mil/mês", "R$ 500 mil - R$ 1 milhão/mês", "Acima de R$ 1 milhão/mês"];
      } else if (faturamento && isConsultor && !projetos_ativos) {
        // Consultores: perguntar projetos ativos ao invés de funcionários
        parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "E quantos projetos ativos você tem rodando hoje?";
        parsed.options = ["1-2 projetos", "3-5 projetos", "6-10 projetos", "Mais de 10 projetos"];
      } else if (faturamento && !isConsultor && !funcionarios) {
        parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + "E quantos funcionários tem na equipe?";
        parsed.options = ["1-5 funcionários", "6-15 funcionários", "16-50 funcionários", "51-200 funcionários", "Mais de 200"];
      } else if ((isConsultor ? projetos_ativos : funcionarios) && !parsed.next_action) {
        // All qualification data collected — check if we need cross-validation before form
        const fatLower = faturamento.toLowerCase();
        const funcLower = funcionarios.toLowerCase();
        const projLower = projetos_ativos.toLowerCase();
        // Consultoria leads skip validation entirely — go straight to form
        const needsValidation = isConsultor
          ? false
          : (fatLower.includes("até") && fatLower.includes("50") && (funcLower.includes("1-5") || funcLower.includes("1 a 5")));
        
        const alreadyValidated = normalizeText(cd.validacao_confirmada);

        if (needsValidation && !alreadyValidated) {
          // Show validation message with buttons — do NOT show form yet
          parsed.message = `Só pra confirmar, ${nome || "você"}, a gente sabe que faturamento pode variar né... O Orbit foi desenvolvido pra empresas a partir de R$ 50 mil de faturamento com equipes de pelo menos 5 pessoas. As informações que você me passou estão certinhas?`;
          parsed.options = ["✅ Estão certas, Olívia", "✏️ Não, quero corrigir"];
          parsed.next_action = null; // Do NOT show form
        } else {
          // No validation needed or already validated — show form
          parsed.next_action = "show_form";
          parsed.message = (parsed.message ? parsed.message + "\n\n" : "") + `Incrível, ${nome || "você"}! Já tenho tudo que preciso pra te direcionar. Agora só preciso dos seus dados de contato pra gente continuar 👇`;
        }
      }
    }

    // PRE-FORM VALIDATION & BUDGET INTERCEPT — two-step flow for leads at disqualification threshold
    {
      const cd = collected_data || {};
      const ed = parsed.extracted_data || {};
      const nome = normalizeText(ed.nome) || normalizeText(cd.nome) || "Você";
      const faturamento = (normalizeText(ed.faturamento) || normalizeText(cd.faturamento)).toLowerCase();
      const funcionarios = (normalizeText(ed.funcionarios) || normalizeText(cd.funcionarios)).toLowerCase();
      const projetos_ativos = (normalizeText(ed.projetos_ativos) || normalizeText(cd.projetos_ativos)).toLowerCase();
      const validacao = normalizeText(cd.validacao_confirmada);
      const isConsultorCheck = parsed.is_consultor || (effectiveSegment && (effectiveSegment.toLowerCase().includes("consultoria") || effectiveSegment.toLowerCase().includes("consultor")));

      const hasFormData = !!(normalizeText(cd.whatsapp) && normalizeText(cd.email));
      // Consultoria leads skip validation/budget entirely — go straight to form
      const needsValidation = isConsultorCheck
        ? false
        : (faturamento.includes("até") && faturamento.includes("50") && (funcionarios.includes("1-5") || funcionarios.includes("1 a 5")));

      if (!hasFormData && needsValidation) {
        // STEP 1: Data validation — "Estão certas?"
        if (!validacao && (parsed.next_action === "show_form" || parsed.qualification_status === "disqualified" || parsed.next_action === null)) {
          parsed.next_action = null;
          parsed.qualification_status = "collecting";
          parsed.options = ["✅ Estão certas, Olívia", "✏️ Não, quero corrigir"];
          parsed.should_send_audio = false;
          if (isConsultorCheck) {
            parsed.message = `Só pra confirmar, ${nome}, a gente sabe que faturamento pode variar né... O programa de canais do Orbit foi pensado pra consultorias a partir de R$ 30 mil de receita e com pelo menos 3 projetos ativos. As informações que você me passou estão certinhas?`;
          } else {
            parsed.message = `Só pra confirmar, ${nome}, a gente sabe que faturamento pode variar né... O Orbit foi desenvolvido pra empresas a partir de R$ 50 mil de faturamento com equipes de pelo menos 5 pessoas. As informações que você me passou estão certinhas?`;
          }
        }
        // STEP 2: Budget disclosure — lead confirmed data ("sim"), now show investment and ask if it makes sense
        else if (validacao === "sim") {
          // Budget step — override ANY action the AI may have set
          parsed.next_action = null;
          parsed.qualification_status = "collecting";
          parsed.should_send_audio = false;
          parsed.options = ["✅ Sim, faz sentido", "🧪 Quero testar o Orbit"];
          if (isConsultorCheck) {
            parsed.message = `${nome}, quero ser transparente com você. O investimento para se tornar um canal Orbit é a partir de **R$ 1.800/mês**. O programa foi pensado para consultorias com um faturamento e base de projetos mais consolidados. Sabendo disso, faz sentido pra você seguir conhecendo?`;
          } else {
            parsed.message = `${nome}, quero ser transparente com você. O investimento no Orbit é a partir de **R$ 1.200/mês**. A solução foi desenvolvida para empresas com faturamento e equipe mais estruturados. Sabendo disso, faz sentido pra você seguir conhecendo?`;
          }
        }
        // STEP 3: Budget accepted ("budget_aceito") — force show_form regardless of what AI wants
        else if (validacao === "budget_aceito") {
          parsed.next_action = "show_form";
          parsed.qualification_status = "collecting";
          parsed.should_send_audio = false;
          parsed.options = null;
          parsed.message = `Perfeito, ${nome}! Agora só preciso dos seus dados de contato pra gente continuar 👇`;
        }
      }
    }

    // DETERMINISTIC DISQUALIFICATION CHECK — overrides AI if it missed it
    {
      const cd = collected_data || {};
      const ed = parsed.extracted_data || {};
      const nome = normalizeText(ed.nome) || normalizeText(cd.nome) || "Você";
      const faturamento = (normalizeText(ed.faturamento) || normalizeText(cd.faturamento)).toLowerCase();
      const funcionarios = (normalizeText(ed.funcionarios) || normalizeText(cd.funcionarios)).toLowerCase();
      const projetos_ativos = (normalizeText(ed.projetos_ativos) || normalizeText(cd.projetos_ativos)).toLowerCase();
      const hasForm = !!(normalizeText(cd.whatsapp) && normalizeText(cd.email));
      const isConsultor = parsed.is_consultor || (effectiveSegment && (effectiveSegment.toLowerCase().includes("consultoria") || effectiveSegment.toLowerCase().includes("consultor")));

      // Determine if all qualification data is present
      const hasAllQualData = isConsultor
        ? !!(faturamento && projetos_ativos)
        : !!(faturamento && funcionarios);

      const budgetAccepted = normalizeText(cd.validacao_confirmada) === "budget_aceito";
      // Only apply after form is submitted AND all qualification data is present AND AI didn't already set disqualified
      // If the lead already accepted the budget (budget_aceito), treat as qualified — show normal 3 options
      // Consultoria leads are NEVER disqualified — they always go straight to form and normal flow
      if (hasForm && hasAllQualData && !budgetAccepted && !isConsultor && parsed.qualification_status !== "disqualified" && (!parsed.next_action || parsed.next_action === "show_form")) {
        let shouldDisqualify = false;
        let budgetMsg = "";

        // B2B: desqualificado = fatura ≤ R$50k AND < 5 funcionários (1-5)
        const lowRevenue = faturamento.includes("até") && faturamento.includes("50");
        const fewEmployees = funcionarios.includes("1-5") || funcionarios.includes("1 a 5");
        if (lowRevenue && fewEmployees) {
          shouldDisqualify = true;
          budgetMsg = `${nome}, quero ser transparente com você. O investimento no Orbit é a partir de **R$ 1.200/mês**. A solução foi desenvolvida para empresas a partir de R$ 50 mil de faturamento com equipes estruturadas. Sabendo disso, faz sentido pra você seguir conhecendo?`;
        }

        if (shouldDisqualify) {
          console.log("[chat2-ai] DETERMINISTIC DISQUALIFICATION applied for faturamento:", faturamento, "funcionarios:", funcionarios);
          parsed.qualification_status = "disqualified";
          parsed.message = budgetMsg;
          parsed.options = ["✅ Sim, faz sentido", "🧪 Quero testar o Orbit"];
          parsed.should_send_audio = true;
          parsed.audio_context = "Olivia explains the minimum investment and asks if the lead wants to join a group demo";
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat2-ai error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
