UPDATE presentation_slides 
SET content = jsonb_set(
  content::jsonb,
  '{cards}',
  '[
    {"badge": "Planejamento com IA", "title": "Estrategista", "desc": "SWOT, BSC, objetivos estratégicos, planos de ação com responsáveis e prazos. Substitui um consultor de R$30-80k/projeto."},
    {"badge": "Operação padronizada", "title": "Processos", "desc": "Mapeia processos, cria instruções de trabalho, tarefas com responsáveis. Substitui um analista de R$8-12k/mês."},
    {"badge": "Treinamento + Dados", "title": "Pessoas", "desc": "Microlearning diário via WhatsApp, KPIs, causa raiz, ações corretivas, formulários e clima. Substitui 2-3 profissionais."},
    {"badge": "Vendas + CRM", "title": "Comercial", "desc": "Gestão de pipeline, follow-ups automáticos, previsão de vendas e integração com CRM. Substitui um coordenador comercial de R$8-15k/mês."},
    {"badge": "Inteligência de Dados", "title": "BI", "desc": "Dashboards executivos, relatórios automáticos, análise de indicadores e alertas inteligentes. Substitui um analista de BI de R$8-15k/mês."}
  ]'::jsonb
)
WHERE id = '97d3cf89-517b-4b54-89af-bea27c119f9f'