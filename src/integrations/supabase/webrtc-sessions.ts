
import { supabase } from './client';

interface WebRTCSession {
  id: string;
  data: {
    sessionId: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidatesOffer?: RTCIceCandidateInit[];
    candidatesAnswer?: RTCIceCandidateInit[];
  };
  created_at: string;
  updated_at: string;
}

export async function createWebRTCSession(id: string, sessionData: any): Promise<WebRTCSession | null> {
  try {
    const { data, error } = await supabase
      .from('webrtc_sessions')
      .insert({
        id,
        data: sessionData
      } as any)
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
      .single() as any;
      
    if (error) throw error;
    return data as WebRTCSession;
  } catch (error) {
    console.error('Error fetching WebRTC session:', error);
    return null;
  }
}

export async function updateWebRTCSession(id: string, sessionData: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('webrtc_sessions')
      .update({
        data: sessionData
      } as any)
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
