-- Shift slides >= 8 up by 1 to make room for diagnostic CTA at position 8
UPDATE presentation_slides SET slide_order = slide_order + 1 WHERE slide_order >= 8 AND is_active = true;

-- Insert diagnostic CTA slide at position 8
INSERT INTO presentation_slides (slide_order, layout_type, title, content, is_active)
VALUES (8, 'qrcode', 'Qual o nível da sua empresa?', '{
  "tag": "Diagnóstico Interativo",
  "subtitle": "Descubra agora a maturidade da sua empresa em Gestão e IA",
  "body": "Pegue seu celular, escaneie o QR Code e responda 13 perguntas rápidas.\nSeu resultado sai na hora.",
  "qrUrl": "https://orbitgestaolead.lovable.app/diagnostico",
  "badges": ["Menos de 5 minutos", "Resultado instantâneo", "Personalizado para seu setor"]
}'::jsonb, true);

-- Fix Grupo GSN slide: change from before/after to tag/title/desc format
UPDATE presentation_slides
SET content = '{
  "tag": "Quem Somos",
  "subtitle": "O maior grupo de consultoria em gestão e ISO do Brasil. Duas empresas, uma missão: organizar e escalar negócios com inteligência artificial.",
  "comparisons": [
    {"tag": "Desde 1994", "title": "Templum Consultoria", "desc": "Líder em ISO no Brasil. +8.000 empresas atendidas. 30 anos transformando gestão em resultados."},
    {"tag": "Digitalização", "title": "Evolutto", "desc": "Líder em digitalização de consultorias. A plataforma que permitiu escalar conhecimento para milhares de empresas."},
    {"tag": "60 profissionais", "title": "Grupo GSN", "desc": "Sede em Florianópolis e Portugal. Agora com IA integrada: nasce o Orbit."}
  ],
  "footer": "Não somos uma startup. Somos 30 anos de gestão — agora com IA."
}'::jsonb
WHERE id = '6b125df2-31b0-40b6-bf85-f75a4e8a6c14';