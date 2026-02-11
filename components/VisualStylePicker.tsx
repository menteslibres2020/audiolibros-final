
import React from 'react';
import { VisualStyle } from '../typesImage';

interface VisualStylePickerProps {
  selected: VisualStyle;
  onSelect: (style: VisualStyle) => void;
  disabled?: boolean;
}

const VisualStylePicker: React.FC<VisualStylePickerProps> = ({ selected, onSelect, disabled }) => {
  const styles: VisualStyle[] = [
    'Cinematic', 'Photorealistic', 'Anime', 'Oil Painting',
    'Cyberpunk', 'Watercolor', 'Sketch', '3D Render', 'Retro'
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <button
          key={style}
          disabled={disabled}
          onClick={() => onSelect(style)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selected === style
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none'
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        >
          {style}
        </button>
      ))}
    </div>
  );
};

export default VisualStylePicker;
