
-- Create a table for WebRTC stream sessions
CREATE TABLE IF NOT EXISTS public.stream_sessions (
  id UUID PRIMARY KEY,
  host_id UUID REFERENCES auth.users NOT NULL,
  offer JSONB,
  answer JSONB,
  offer_candidates JSONB[] DEFAULT '{}',
  answer_candidates JSONB[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Set up RLS policies
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view stream sessions (needed for joining streams)
CREATE POLICY "Anyone can view stream sessions" 
  ON public.stream_sessions 
  FOR SELECT 
  USING (true);

-- Only hosts can update their own sessions
CREATE POLICY "Hosts can update their own sessions" 
  ON public.stream_sessions 
  FOR UPDATE 
  USING (host_id = auth.uid());

-- Only hosts can insert their own sessions
CREATE POLICY "Hosts can insert their own sessions" 
  ON public.stream_sessions 
  FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER set_stream_sessions_updated_at
  BEFORE UPDATE ON public.stream_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add realtime subscription capability
ALTER TABLE public.stream_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_sessions;
