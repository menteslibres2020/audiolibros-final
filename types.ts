
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
}

export interface NarrationRequest {
  text: string;
  voiceId: string;
  emotion: string;
}

export interface NarrationResult {
  audioUrl: string;
  id: string;
  timestamp: number;
  text: string;
  voiceName: string;
  storagePath?: string;
}
