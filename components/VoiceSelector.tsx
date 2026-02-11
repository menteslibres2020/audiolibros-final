
import React from 'react';
import { VOICES } from '../constants';

interface VoiceSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {VOICES.map((voice) => {
        const isSelected = selectedId === voice.id;
        const isFemale = voice.gender === 'female';

        return (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border transition-all flex items-center gap-3 md:gap-4 text-left ${isSelected
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
              }`}
          >
            <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center text-xl md:text-2xl shadow-sm transition-colors ${isSelected
              ? (isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white')
              : (isFemale ? 'bg-pink-50 text-pink-400' : 'bg-blue-50 text-blue-400')
              }`}>
              <i className={`fa-solid ${isFemale ? 'fa-person-dress' : 'fa-person'}`}></i>
            </div>
            <div className="min-w-0">
              <h4 className={`font-extrabold text-xs md:text-sm truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                {voice.name}
              </h4>
              <p className={`text-[10px] md:text-[11px] font-medium leading-tight mt-1 line-clamp-2 ${isSelected ? 'text-indigo-600/70 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {voice.description}
              </p>
              <div className="mt-1.5 md:mt-2 flex items-center gap-1">
                <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isFemale ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                  {isFemale ? 'Narradora' : 'Narrador'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default VoiceSelector;
