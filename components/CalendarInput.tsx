import React, { useState } from 'react';

interface CalendarInputProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export const CalendarInput: React.FC<CalendarInputProps> = ({ selectedDay, onSelectDay }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: startDay }, (_, i) => i);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="w-full bg-[#161618] border border-white/10 rounded-xl p-4 animate-enter">
      <div className="flex items-center justify-between mb-4">
        <button 
            type="button"
            onClick={() => changeMonth(-1)}
            className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span className="text-sm font-medium text-gray-200">
            {months[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button 
            type="button"
            onClick={() => changeMonth(1)}
            className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] text-gray-500 font-bold">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingArray.map(i => <div key={`pad-${i}`} />)}
        {daysArray.map(day => (
            <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`
                    h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-all
                    ${selectedDay === day 
                        ? 'bg-primary/20 text-primary border border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)] font-bold' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
            >
                {day}
            </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 mt-3 text-center">
        Se o mês não tiver esse dia, será agendado no último dia.
      </p>
    </div>
  );
};