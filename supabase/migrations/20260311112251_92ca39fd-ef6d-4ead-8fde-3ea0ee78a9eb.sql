ALTER TABLE public.diagnostic_responses 
  ADD COLUMN meeting_transcription text,
  ADD COLUMN meeting_summary jsonb;