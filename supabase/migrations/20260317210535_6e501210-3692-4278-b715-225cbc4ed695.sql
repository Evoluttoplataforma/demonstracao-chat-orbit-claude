
-- Add confirmation call tracking column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ligacao_confirmacao_enviada boolean NOT NULL DEFAULT false;

-- Add confirmation call tracking column to sala_presencas
ALTER TABLE public.sala_presencas ADD COLUMN IF NOT EXISTS ligacao_confirmacao_enviada boolean NOT NULL DEFAULT false;

-- Create call-audio storage bucket for temporary MP3 files
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-audio', 'call-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read call audio files (Twilio needs public access)
CREATE POLICY "Public read call audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'call-audio');

-- Allow authenticated and anon to insert call audio (edge functions use service role but just in case)
CREATE POLICY "Service can upload call audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'call-audio');

-- Allow deletion of call audio files
CREATE POLICY "Service can delete call audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'call-audio');

-- Enable pg_net for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
