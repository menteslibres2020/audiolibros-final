
import { VoiceOption } from './types';

export const VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Martina', description: 'Voz equilibrada y profesional', gender: 'female' },
  { id: 'Puck', name: 'Bautista', description: 'Voz juvenil y enérgica', gender: 'male' },
  { id: 'Charon', name: 'Facundo', description: 'Voz madura y profunda', gender: 'male' },
  { id: 'Zephyr', name: 'Julieta', description: 'Voz suave y calmada', gender: 'female' },
  { id: 'Fenrir', name: 'Santiago', description: 'Voz autoritaria y clara', gender: 'male' },
  { id: 'Aoede', name: 'Milagros', description: 'Narradora potente y dramática', gender: 'female' },
  // Voces Virtuales (Estilos Específicos)
  { id: 'Draco', name: 'Draco', description: 'Épico y Fantasía (Aventuras)', gender: 'male' },
  { id: 'Marcus', name: 'Marcus', description: 'Documental e Historia (Solemne)', gender: 'male' },
  { id: 'Orion', name: 'Orión', description: 'Misterio y Crimen (Profundo)', gender: 'male' },
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
