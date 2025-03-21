
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
export const isStreamActive = (stream: LivestreamType): boolean => {
  return stream.is_active === true && stream.ended_at === null;
};
