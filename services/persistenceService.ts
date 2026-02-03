
import { EpubChapter } from './epubService';
import { NarrationResult } from '../types';

const DB_NAME = 'LibrotecaDB';
const DB_VERSION = 1;

export interface AppState {
  text: string;
  projectTitle: string;
  voiceId: string;
  emotion: string;
  mode: 'text' | 'epub';
  bookTitle: string;
  bookAuthor: string;
  chapters: EpubChapter[];
  history: NarrationResult[];
}

class PersistenceService {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState');
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveState(state: Partial<AppState>): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction('appState', 'readwrite');
    const store = transaction.objectStore('appState');

    // Clonamos para serialización
    const chaptersToSave = state.chapters ? JSON.parse(JSON.stringify(state.chapters)) : undefined;
    const historyToSave = state.history ? JSON.parse(JSON.stringify(state.history)) : undefined;

    // Convertimos audios a ArrayBuffer
    const serializedChapters = chaptersToSave ? await this.serializeChapters(chaptersToSave) : undefined;
    const serializedHistory = historyToSave ? await this.serializeHistory(historyToSave) : undefined;

    const dataToSave: any = { ...state };
    if (serializedChapters) dataToSave.chapters = serializedChapters;
    if (serializedHistory) dataToSave.history = serializedHistory;

    return new Promise((resolve, reject) => {
      const entries = Object.entries(dataToSave).filter(([_, v]) => v !== undefined);
      let remaining = entries.length;
      if (remaining === 0) resolve();

      entries.forEach(([key, value]) => {
        const req = store.put(value, key);
        req.onsuccess = () => {
          remaining--;
          if (remaining === 0) resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  async loadState(): Promise<Partial<AppState>> {
    const db = await this.getDB();
    const transaction = db.transaction('appState', 'readonly');
    const store = transaction.objectStore('appState');
    const state: Partial<AppState> = {};
    const keys = ['text', 'projectTitle', 'voiceId', 'emotion', 'mode', 'bookTitle', 'bookAuthor', 'chapters', 'history'];

    return new Promise((resolve) => {
      let completed = 0;
      keys.forEach(key => {
        const request = store.get(key);
        request.onsuccess = async () => {
          let val = request.result;
          if (key === 'chapters' && val) val = await this.deserializeChapters(val);
          if (key === 'history' && val) val = await this.deserializeHistory(val);
          state[key as keyof AppState] = val;
          completed++;
          if (completed === keys.length) resolve(state);
        };
        request.onerror = () => {
          completed++;
          if (completed === keys.length) resolve(state);
        };
      });
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction('appState', 'readwrite');
    transaction.objectStore('appState').clear();
  }

  private async serializeChapters(chapters: any[]): Promise<any[]> {
    return Promise.all(chapters.map(async ch => {
      const segments = await Promise.all((ch.segments || []).map(async (seg: any) => {
        if (seg.audioUrl && (seg.audioUrl.startsWith('blob:') || seg.audioUrl.startsWith('http'))) {
          try {
            const res = await fetch(seg.audioUrl);
            const buffer = await res.arrayBuffer();
            return { ...seg, audioData: buffer, audioUrl: null };
          } catch (e) { return seg; }
        }
        return seg;
      }));
      return { ...ch, segments };
    }));
  }

  private async deserializeChapters(chapters: any[]): Promise<EpubChapter[]> {
    return chapters.map(ch => {
      const segments = (ch.segments || []).map((seg: any) => {
        if (seg.audioData) {
          const blob = new Blob([seg.audioData], { type: 'audio/wav' });
          return { ...seg, audioUrl: URL.createObjectURL(blob), audioData: null };
        }
        return seg;
      });
      return { ...ch, segments };
    });
  }

  private async serializeHistory(history: NarrationResult[]): Promise<any[]> {
    return Promise.all(history.map(async item => {
      if (item.audioUrl && (item.audioUrl.startsWith('blob:') || item.audioUrl.startsWith('http'))) {
        try {
          const res = await fetch(item.audioUrl);
          const buffer = await res.arrayBuffer();
          return { ...item, audioData: buffer, audioUrl: null };
        } catch (e) { return item; }
      }
      return item;
    }));
  }

  private async deserializeHistory(history: any[]): Promise<NarrationResult[]> {
    return history.map(item => {
      if (item.audioData) {
        const blob = new Blob([item.audioData], { type: 'audio/wav' });
        return { ...item, audioUrl: URL.createObjectURL(blob), audioData: null };
      }
      return item;
    });
  }
}

export const persistenceService = new PersistenceService();
