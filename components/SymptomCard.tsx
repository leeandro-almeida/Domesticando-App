import React from 'react';
import { SymptomLevel } from '../types';

interface SymptomCardProps {
  level: SymptomLevel;
  label: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const SymptomCard: React.FC<SymptomCardProps> = ({ level, label, description, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative flex flex-col items-start justify-center p-4 rounded-xl border transition-all duration-300 w-full h-full text-left group
        ${isSelected 
          ? 'bg-primary/5 border-primary shadow-glow ring-1 ring-primary/20' 
          : 'bg-[#161618] border-white/10 hover:border-white/20 hover:bg-white/5'}
      `}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className={`
          text-lg font-bold transition-colors duration-300
          ${isSelected ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}
        `}>
          {level}
        </span>
        {isSelected && (
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        )}
      </div>
      <span className={`
        text-sm font-medium leading-tight
        ${isSelected ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'}
      `}>
        {description}
      </span>
    </button>
  );
};