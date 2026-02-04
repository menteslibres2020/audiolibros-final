
import { VoiceOption } from './types';

// ELENCO COMPLETAMENTE RENOVADO: 9 Voces (3 Femeninas, 6 Masculinas)
// Nombres Latinos y Tonos Distintivos.
export const VOICES: VoiceOption[] = [
  // --- FEMENINAS (3) ---
  { id: 'Sofia', name: 'Sofía', description: 'Suave, empática y calmada (Romance/Infantil)', gender: 'female' },
  { id: 'Valentina', name: 'Valentina', description: 'Profesional, periodística y clara (No Ficción)', gender: 'female' },
  { id: 'Camila', name: 'Camila', description: 'Dramática, expresiva y teatral (Ficción)', gender: 'female' },

  // --- MASCULINAS (6) ---
  { id: 'Mateo', name: 'Mateo', description: 'Juvenil, enérgico y rápido (Aventuras)', gender: 'male' },
  { id: 'Diego', name: 'Diego', description: 'Estándar, firme y confiable (Clásicos)', gender: 'male' },
  { id: 'Alejandro', name: 'Alejandro', description: 'Profunda, grave y de impacto (Thriller)', gender: 'male' },
  { id: 'Leonardo', name: 'Leonardo', description: 'Heroica, vibrante y motivacional (Épica)', gender: 'male' },
  { id: 'Ricardo', name: 'Ricardo', description: 'Voz de Anciano Sabio y Solemne (Historia)', gender: 'male' },
  { id: 'Gabriel', name: 'Gabriel', description: 'Misteriosa y Rasposa (Novela Negra)', gender: 'male' },
];

export const EMOTIONS = [
  "Neutral",
  "Alegre",
  "Triste",
  "Enojado",
  "Misterioso",
  "Informativo",
  "Emocionado",
  "Susurrante" // Mantener opción por compatibilidad, pero el prompt por defecto prohíbe susurar
];
