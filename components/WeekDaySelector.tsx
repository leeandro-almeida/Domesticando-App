import React from 'react';

interface WeekDaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { val: 1, label: 'S' }, // Seg
  { val: 2, label: 'T' }, // Ter
  { val: 3, label: 'Q' }, // Qua
  { val: 4, label: 'Q' }, // Qui
  { val: 5, label: 'S' }, // Sex
  { val: 6, label: 'S' }, // Sáb
  { val: 0, label: 'D' }, // Dom
];

export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({ selectedDays, onChange }) => {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex gap-2 justify-between">
      {DAYS.map((d, i) => {
        const isSelected = selectedDays.includes(d.val);
        return (
          <button
            key={i}
            onClick={() => toggleDay(d.val)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border
              ${isSelected 
                ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'bg-[#161618] border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'}
            `}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
};