
-- Create a table to store WebRTC session data
CREATE TABLE IF NOT EXISTS public.webrtc_sessions (
  id UUID PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.webrtc_sessions ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE TRIGGER set_webrtc_sessions_updated_at
BEFORE UPDATE ON public.webrtc_sessions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Grant access to authenticated users
CREATE POLICY "Users can create WebRTC sessions"
  ON public.webrtc_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view WebRTC sessions"
  ON public.webrtc_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update WebRTC sessions"
  ON public.webrtc_sessions FOR UPDATE
  TO authenticated
  USING (true);
