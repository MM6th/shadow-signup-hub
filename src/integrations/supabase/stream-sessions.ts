
import { supabase } from './client';
import { Json } from './types';

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

// Helper functions to convert between RTCSessionDescriptionInit and Json
const jsonToRTCSessionDescription = (json: Json | null): RTCSessionDescriptionInit | undefined => {
  if (!json) return undefined;
  return json as unknown as RTCSessionDescriptionInit;
};

const jsonToRTCIceCandidateArray = (jsonArray: Json[] | null): RTCIceCandidateInit[] => {
  if (!jsonArray) return [];
  return jsonArray.map(item => item as unknown as RTCIceCandidateInit);
};

export const getOrCreateStreamSession = async (sessionId: string): Promise<StreamSessionData | null> => {
  try {
    // First check if a session already exists
    const { data: existingSession, error: getError } = await supabase
      .from('stream_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (getError && getError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching stream session:', getError);
      return null;
    }
    
    if (existingSession) {
      // Convert from database types to our interface
      return {
        ...existingSession,
        offer: jsonToRTCSessionDescription(existingSession.offer),
        answer: jsonToRTCSessionDescription(existingSession.answer),
        offer_candidates: jsonToRTCIceCandidateArray(existingSession.offer_candidates),
        answer_candidates: jsonToRTCIceCandidateArray(existingSession.answer_candidates),
      } as StreamSessionData;
    }
    
    // Create new session if it doesn't exist
    const { data: session, error: createError } = await supabase
      .from('stream_sessions')
      .insert({
        id: sessionId,
        host_id: (await supabase.auth.getSession()).data.session?.user.id,
        offer_candidates: [],
        answer_candidates: []
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating stream session:', createError);
      return null;
    }
    
    // Convert from database types to our interface
    return {
      ...session,
      offer: jsonToRTCSessionDescription(session.offer),
      answer: jsonToRTCSessionDescription(session.answer),
      offer_candidates: jsonToRTCIceCandidateArray(session.offer_candidates),
      answer_candidates: jsonToRTCIceCandidateArray(session.answer_candidates),
    } as StreamSessionData;
  } catch (error) {
    console.error('Error in getOrCreateStreamSession:', error);
    return null;
  }
};

export const getStreamSession = async (sessionId: string): Promise<StreamSessionData | null> => {
  try {
    const { data, error } = await supabase
      .from('stream_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (error) {
      console.error('Error fetching stream session:', error);
      return null;
    }
    
    // Convert from database types to our interface
    return {
      ...data,
      offer: jsonToRTCSessionDescription(data.offer),
      answer: jsonToRTCSessionDescription(data.answer),
      offer_candidates: jsonToRTCIceCandidateArray(data.offer_candidates),
      answer_candidates: jsonToRTCIceCandidateArray(data.answer_candidates),
    } as StreamSessionData;
  } catch (error) {
    console.error('Error in getStreamSession:', error);
    return null;
  }
};

export const updateSessionOffer = async (
  sessionId: string, 
  offer: RTCSessionDescriptionInit
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stream_sessions')
      .update({ offer: offer as unknown as Json })
      .eq('id', sessionId);
      
    if (error) {
      console.error('Error updating session offer:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSessionOffer:', error);
    return false;
  }
};

export const updateSessionAnswer = async (
  sessionId: string, 
  answer: RTCSessionDescriptionInit
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stream_sessions')
      .update({ answer: answer as unknown as Json })
      .eq('id', sessionId);
      
    if (error) {
      console.error('Error updating session answer:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSessionAnswer:', error);
    return false;
  }
};

export const appendOfferCandidate = async (
  sessionId: string, 
  candidate: RTCIceCandidateInit
): Promise<boolean> => {
  try {
    // First get current candidates
    const { data: session, error: getError } = await supabase
      .from('stream_sessions')
      .select('offer_candidates')
      .eq('id', sessionId)
      .single();
      
    if (getError) {
      console.error('Error fetching session for candidates:', getError);
      return false;
    }
    
    // Append new candidate and update
    const candidatesArray = [...(session.offer_candidates || []), candidate as unknown as Json];
    
    const { error: updateError } = await supabase
      .from('stream_sessions')
      .update({ offer_candidates: candidatesArray })
      .eq('id', sessionId);
      
    if (updateError) {
      console.error('Error updating offer candidates:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in appendOfferCandidate:', error);
    return false;
  }
};

export const appendAnswerCandidate = async (
  sessionId: string, 
  candidate: RTCIceCandidateInit
): Promise<boolean> => {
  try {
    // First get current candidates
    const { data: session, error: getError } = await supabase
      .from('stream_sessions')
      .select('answer_candidates')
      .eq('id', sessionId)
      .single();
      
    if (getError) {
      console.error('Error fetching session for candidates:', getError);
      return false;
    }
    
    // Append new candidate and update
    const candidatesArray = [...(session.answer_candidates || []), candidate as unknown as Json];
    
    const { error: updateError } = await supabase
      .from('stream_sessions')
      .update({ answer_candidates: candidatesArray })
      .eq('id', sessionId);
      
    if (updateError) {
      console.error('Error updating answer candidates:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in appendAnswerCandidate:', error);
    return false;
  }
};
