
import React from 'react';
import { AspectRatio } from '../typesImage';

interface AspectRatioPickerProps {
  selected: AspectRatio;
  onSelect: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

const AspectRatioPicker: React.FC<AspectRatioPickerProps> = ({ selected, onSelect, disabled }) => {
  const options: { label: string; value: AspectRatio; icon: string }[] = [
    { label: 'Cuadrado', value: '1:1', icon: 'M4 4h16v16H4z' },
    { label: 'Paisaje', value: '4:3', icon: 'M4 6h16v12H4z' },
    { label: 'Cine', value: '16:9', icon: 'M2 8h20v8H2z' },
    { label: 'Retrato', value: '9:16', icon: 'M8 2h8v20H8z' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
      {options.map((opt) => (
        <button
          key={opt.value}
          disabled={disabled}
          onClick={() => onSelect(opt.value)}
          className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-[2rem] border-2 transition-all duration-300 group aspect-square sm:aspect-auto ${selected === opt.value
              ? 'border-transparent bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] text-white shadow-xl shadow-purple-200 dark:shadow-none scale-105 z-10'
              : 'border-white bg-white dark:bg-slate-800 dark:border-slate-700 text-[#94a3b8] dark:text-slate-500 hover:border-purple-100 dark:hover:border-purple-900 hover:text-purple-600 dark:hover:text-purple-400 shadow-sm hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
        >
          {selected === opt.value && (
            <div className="absolute top-0 right-0 p-3">
              <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
          )}

          <svg
            className={`w-6 h-6 mb-2 transition-all duration-500 ${selected === opt.value ? 'text-white scale-110 rotate-3' : 'text-purple-200 dark:text-slate-600 group-hover:text-purple-400 dark:group-hover:text-purple-400 group-hover:scale-110'
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={opt.icon} />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate w-full px-1">{opt.label}</span>
          <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-tighter transition-opacity ${selected === opt.value ? 'text-white/70' : 'text-gray-300 dark:text-slate-600'}`}>
            {opt.value}
          </span>
        </button>
      ))}
    </div>
  );
};

export default AspectRatioPicker;
