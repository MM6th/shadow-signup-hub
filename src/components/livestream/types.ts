
export interface LivestreamType {
  id: string;
  title: string;
  thumbnail_url: string | null;
  conference_id: string;
  user_id: string;
  created_at: string;
  ended_at: string | null;
  is_active: boolean;
  views: number;
  enable_crypto: boolean;
  enable_paypal: boolean;
}

// Helper function to determine if a stream is truly active
// A stream is only active if is_active is true AND ended_at is null
export const isStreamActive = (stream: LivestreamType): boolean => {
  return stream.is_active === true && stream.ended_at === null;
};
