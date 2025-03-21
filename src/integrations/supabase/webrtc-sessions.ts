
import { supabase } from './client';

// Define the JSON structure for RTCSessionDescription
interface WebRTCSessionData {
  sessionId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidatesOffer?: RTCIceCandidateInit[];
  candidatesAnswer?: RTCIceCandidateInit[];
}

export interface WebRTCSession {
  id: string;
  data: WebRTCSessionData;
  created_at: string;
  updated_at: string;
}

export async function createWebRTCSession(id: string, sessionData: WebRTCSessionData): Promise<WebRTCSession | null> {
  try {
    const { data, error } = await supabase
      .from('webrtc_sessions')
      .insert({
        id,
        data: sessionData
      })
      .select()
      .single();
      
    if (error) throw error;
    return data as WebRTCSession;
  } catch (error) {
    console.error('Error creating WebRTC session:', error);
    return null;
  }
}

export async function getWebRTCSession(id: string): Promise<WebRTCSession | null> {
  try {
    const { data, error } = await supabase
      .from('webrtc_sessions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    // Make sure we return with the correct type
    return data as WebRTCSession;
  } catch (error) {
    console.error('Error fetching WebRTC session:', error);
    return null;
  }
}

export async function updateWebRTCSession(id: string, sessionData: WebRTCSessionData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('webrtc_sessions')
      .update({
        data: sessionData
      })
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating WebRTC session:', error);
    return false;
  }
}

export async function deleteWebRTCSession(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('webrtc_sessions')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting WebRTC session:', error);
    return false;
  }
}
