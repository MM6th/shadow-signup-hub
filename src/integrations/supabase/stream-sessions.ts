
import { supabase } from './client';

export interface StreamSessionData {
  id: string;
  host_id: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  offer_candidates: RTCIceCandidateInit[];
  answer_candidates: RTCIceCandidateInit[];
  created_at: string;
  updated_at: string;
}

// Helper functions to interact with stream sessions via RPC
export const getOrCreateStreamSession = async (sessionId: string): Promise<StreamSessionData | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('stream_session_utils', {
      body: {
        name: 'get_or_create_stream_session',
        params: {
          session_id: sessionId,
          user_id: (await supabase.auth.getSession()).data.session?.user.id
        }
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting or creating stream session:', error);
    return null;
  }
};

export const getStreamSession = async (sessionId: string): Promise<StreamSessionData | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('stream_session_utils', {
      body: {
        name: 'get_stream_session',
        params: {
          session_id: sessionId
        }
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting stream session:', error);
    return null;
  }
};

export const updateSessionOffer = async (
  sessionId: string, 
  offer: RTCSessionDescriptionInit
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('stream_session_utils', {
      body: {
        name: 'update_session_offer',
        params: {
          session_id: sessionId,
          offer_data: offer
        }
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating session offer:', error);
    return false;
  }
};

export const updateSessionAnswer = async (
  sessionId: string, 
  answer: RTCSessionDescriptionInit
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('stream_session_utils', {
      body: {
        name: 'update_session_answer',
        params: {
          session_id: sessionId,
          answer_data: answer
        }
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating session answer:', error);
    return false;
  }
};

export const appendOfferCandidate = async (
  sessionId: string, 
  candidate: RTCIceCandidateInit
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('stream_session_utils', {
      body: {
        name: 'append_offer_candidate',
        params: {
          session_id: sessionId,
          candidate: JSON.stringify(candidate)
        }
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error appending offer candidate:', error);
    return false;
  }
};

export const appendAnswerCandidate = async (
  sessionId: string, 
  candidate: RTCIceCandidateInit
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('stream_session_utils', {
      body: {
        name: 'append_answer_candidate',
        params: {
          session_id: sessionId,
          candidate: JSON.stringify(candidate)
        }
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error appending answer candidate:', error);
    return false;
  }
};
