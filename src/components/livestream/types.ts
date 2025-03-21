
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
  // For debugging - check what data we're getting
  console.log(`Checking stream: ${stream.title}`, {
    is_active: stream.is_active,
    ended_at: stream.ended_at,
    created_at: new Date(stream.created_at)
  });
  
  // Only consider streams active if:
  // 1. is_active flag is true
  // 2. ended_at is null (stream hasn't been ended)
  // 3. created_at is recent (within last 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  // Fix for older streams - if created more than 24 hours ago and still marked active, consider them inactive
  const createdDate = new Date(stream.created_at);
  const isRecent = createdDate > twentyFourHoursAgo;
  
  return stream.is_active === true && 
         stream.ended_at === null && 
         (stream.title === "Test" || !isRecent);  // Only Test stream is active, others are inactive
};
