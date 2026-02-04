
import { VoiceOption } from './types';

export const VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Martina', description: 'Voz equilibrada y profesional', gender: 'female' },
  { id: 'Puck', name: 'Bautista', description: 'Voz juvenil y enérgica', gender: 'male' },
  { id: 'Charon', name: 'Facundo', description: 'Voz madura y profunda', gender: 'male' },
  { id: 'Zephyr', name: 'Julieta', description: 'Voz suave y calmada', gender: 'female' },
  { id: 'Fenrir', name: 'Santiago', description: 'Voz autoritaria y clara', gender: 'male' },
  { id: 'Aoede', name: 'Milagros', description: 'Narradora potente y dramática', gender: 'female' },
  // Voces Especiales (Nuevas)
  { id: 'Dante', name: 'Dante', description: 'Narrador Épico (Aventuras y Fantasía)', gender: 'male' },
  { id: 'Ignacio', name: 'Ignacio', description: 'Voz Mayor y Solemne (Historia)', gender: 'male' },
  { id: 'Vicente', name: 'Vicente', description: 'Voz Intrigante (Thriller y Misterio)', gender: 'male' },
];

export const EMOTIONS = [
  "Neutral",
  "Alegre",
  "Triste",
  "Enojado",
  "Misterioso",
  "Informativo",
  "Emocionado",
  "Susurrante"
];
