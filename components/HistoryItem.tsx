
import React from 'react';
import { NarrationResult } from '../types';

interface HistoryItemProps {
  item: NarrationResult;
  onDelete?: (id: string, storagePath?: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col gap-3 group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
            {item.voiceName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-200 truncate">{item.voiceName}</h4>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={item.audioUrl}
            download={`audio-${item.id}.wav`}
            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Descargar"
          >
            <i className="fa-solid fa-download text-xs"></i>
          </a>
          {onDelete && (
            <button
              onClick={() => onDelete(item.id, item.storagePath)}
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-red-900/30 transition-colors"
              title="Eliminar permanentemente"
            >
              <i className="fa-solid fa-trash text-xs"></i>
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
        "{item.text}"
      </p>
      <audio controls src={item.audioUrl} className="w-full h-8 opacity-70 hover:opacity-100" />
    </div>
  );
};

export default HistoryItem;