
import React from 'react';
import { VisualStyle } from '../typesImage';

interface VisualStylePickerProps {
  selected: VisualStyle;
  onSelect: (style: VisualStyle) => void;
  disabled?: boolean;
}

const VisualStylePicker: React.FC<VisualStylePickerProps> = ({ selected, onSelect, disabled }) => {
  const styles: VisualStyle[] = [
    'Cinematic',
    'Abstract Art',
    'Oil Painting',
    'Minimalist',
    'Fantasy',
    'Dark Noir'
  ];

  return (
    <div className="space-y-4">
      <label className="block text-[10px] font-black text-[#94a3b8] dark:text-slate-500 uppercase tracking-widest mb-4">
        Estilo Visual
      </label>
      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => (
          <button
            key={style}
            disabled={disabled}
            onClick={() => onSelect(style)}
            className={`py-3.5 px-6 rounded-2xl text-[12px] font-bold transition-all duration-200 border ${selected === style
                ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-lg shadow-indigo-100 dark:shadow-none'
                : 'bg-white dark:bg-slate-800 border-[#f1f5f9] dark:border-slate-700 text-[#64748b] dark:text-slate-400 hover:border-[#6366f1]/30 hover:bg-indigo-50/30 dark:hover:bg-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VisualStylePicker;
