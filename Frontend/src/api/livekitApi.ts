/**
 * src/api/livekitApi.ts
 */
import api, { ApiResponse } from './axios';

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  room: string;
  identity: string;
  name: string;
  voice?: {
    id: string;
    name: string;
    description: string;
    rate: number;
    pitch: number;
  };
}

export const livekitApi = {
  getToken: async (payload?: { identity?: string; room?: string; name?: string }) => {
    const { data } = await api.post<ApiResponse<LiveKitTokenResponse>>('/livekit/token', payload || {});
    return data;
  },
  synthesizeSpeech: async (payload: { text: string; voice_id?: string }) => {
    const { data } = await api.post<ApiResponse<{
      text: string;
      voice_id: string;
      voice_name: string;
      persona: string;
      rate: number;
      pitch: number;
    }>>('/livekit/tts', payload);
    return data;
  },
  getDeepgramAudio: async (text: string): Promise<Blob | null> => {
    try {
      const response = await api.post('/livekit/tts-audio', { text }, { responseType: 'blob' });
      return response.data as Blob;
    } catch {
      return null;
    }
  },
};
