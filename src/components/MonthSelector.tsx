import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';

interface MonthSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  return (
    <div className="relative select-none">
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(subMonths(value, 1))} className="text-2xl px-2">&#8592;</button>
        <h2
          className="text-lg font-bold cursor-pointer"
          onClick={() => setShowPicker(v => !v)}
        >
          {format(value, 'MMMM yyyy')}
        </h2>
        <button onClick={() => onChange(addMonths(value, 1))} className="text-2xl px-2">&#8594;</button>
      </div>
      {showPicker && (
        <div ref={pickerRef} className="absolute left-1/2 -translate-x-1/2 top-10 z-30 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-80 backdrop-blur-xl flex flex-col items-center animate-fade-in">
          <div className="flex justify-between items-center w-full mb-4">
            <button
              className="text-lg px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={e => { e.stopPropagation(); onChange(new Date(value.getFullYear() - 1, value.getMonth(), 1)); }}
            >&#8593;</button>
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{value.getFullYear()}</span>
            <button
              className="text-lg px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={e => { e.stopPropagation(); onChange(new Date(value.getFullYear() + 1, value.getMonth(), 1)); }}
            >&#8595;</button>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full mb-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <button
                key={i}
                className={`px-3 py-2 rounded-lg font-semibold transition-colors text-slate-700 dark:text-slate-200 ${value.getMonth() === i ? 'bg-teal-500 text-white shadow' : 'hover:bg-teal-100 dark:hover:bg-teal-700'}`}
                onClick={e => { e.stopPropagation(); onChange(new Date(value.getFullYear(), i, 1)); setShowPicker(false); }}
              >
                {format(new Date(value.getFullYear(), i, 1), 'MMM')}
              </button>
            ))}
          </div>
          <button
            className="mt-2 w-full py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            onClick={e => { e.stopPropagation(); setShowPicker(false); }}
          >Close</button>
        </div>
      )}
    </div>
  );
};
