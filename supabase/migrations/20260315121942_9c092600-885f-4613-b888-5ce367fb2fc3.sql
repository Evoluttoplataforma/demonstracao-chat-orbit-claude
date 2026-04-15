
-- Clear old slides and insert the 13 new B2B slides matching the hardcoded presentation
DELETE FROM presentation_slides;

INSERT INTO presentation_slides (slide_order, layout_type, title, content, is_active) VALUES
(0, 'hero', 'Abertura com Olívia', '{"subtitle":"Oi! Eu sou a Olívia, especialista em IA e Gestão do Orbit."}', true),
(1, 'stats', 'O Gap: Capacidade vs. Adoção', '{"subtitle":"A IA já pode fazer quase tudo."}', true),
(2, 'cards', 'A Nova Escala', '{"subtitle":"O jogo mudou."}', true),
(3, 'steps', 'Os 3 Estágios da Maturidade em IA', '{"subtitle":"Em qual estágio sua empresa está?"}', true),
(4, 'cards', 'Quem Somos', '{"subtitle":"30 anos de gestão. Agora com IA."}', true),
(5, 'statement', 'O Problema Real', '{"body":"Vão quebrar por falta de RESULTADO."}', true),
(6, 'table', 'Os Agentes de IA do Orbit', '{"subtitle":"Novos agentes são incorporados continuamente"}', true),
(7, 'comparison', 'Consultoria Recorrente Passiva', '{"subtitle":"Consultoria que não para quando o projeto acaba"}', true),
(8, 'qrcode', 'Diagnóstico Interativo', '{"subtitle":"Qual o nível da sua empresa?"}', true),
(9, 'statement', 'Demonstração ao Vivo', '{"subtitle":"Vamos ver na prática?"}', true),
(10, 'cards', 'Planos e Investimento', '{"subtitle":"Investimento"}', true),
(11, 'statement', 'Garantia de Resultado', '{"subtitle":"Risco Zero"}', true),
(12, 'cta', 'Fechamento — Olívia Convida', '{"subtitle":"Pronto para montar seu time de IA?","buttonText":"Agendar minha configuração","buttonLink":"/chat"}', true);
