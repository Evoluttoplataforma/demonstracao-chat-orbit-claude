
-- Shift all existing slides up by 1
UPDATE public.presentation_slides SET slide_order = slide_order + 1;

-- Insert Olivia slide as slide 1 (order 0)
INSERT INTO public.presentation_slides (slide_order, layout_type, title, content, is_active)
VALUES (0, 'image', 'Olívia é Real?', '{"imagePath": "/assets/olivia-real.png", "subtitle": "Conheça a Olívia", "buttonText": "Descubra", "buttonLink": "https://drive.google.com/drive/folders/1-lhKpiDBre76cWkNvwy6T9Y9ck6yGZcS?hl=pt-br"}', true);
