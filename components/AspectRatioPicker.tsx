
import React from 'react';
import { Square, Monitor, Smartphone, RectangleHorizontal } from 'lucide-react';
import { AspectRatio } from '../typesImage';

interface AspectRatioPickerProps {
  selected: AspectRatio;
  onSelect: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

const AspectRatioPicker: React.FC<AspectRatioPickerProps> = ({ selected, onSelect, disabled }) => {
  const options: { value: AspectRatio; label: string; icon: React.ReactNode }[] = [
    { value: '1:1', label: 'Cuadrado', icon: <Square className="w-6 h-6" /> },
    { value: '16:9', label: 'Panorámico', icon: <Monitor className="w-6 h-6" /> },
    { value: '9:16', label: 'Historia', icon: <Smartphone className="w-6 h-6" /> },
    { value: '4:3', label: 'Clásico', icon: <RectangleHorizontal className="w-6 h-6" /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          disabled={disabled}
          onClick={() => onSelect(opt.value)}
          className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 ${selected === opt.value
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100 shadow-md dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300 dark:ring-indigo-900'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        >
          {opt.icon}
          <span className="text-xs font-bold">{opt.label}</span>
          <span className="text-[10px] opacity-70">{opt.value}</span>
        </button>
      ))}
    </div>
  );
};

export default AspectRatioPicker;
