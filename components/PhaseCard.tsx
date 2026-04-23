import React from 'react';
import { PhaseDetail } from '../types';

interface PhaseCardProps {
  phase: PhaseDetail;
  isCurrent?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'display' | 'selectable'; // 'display' for Next Phase blocks, 'selectable' for Change Phase list
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ 
  phase, 
  isCurrent, 
  isSelected, 
  onClick, 
  variant = 'selectable' 
}) => {
  const baseClasses = "relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 w-full text-left";
  
  const variantClasses = variant === 'selectable' 
    ? (isSelected 
        ? "bg-primary/10 border-primary shadow-glow ring-1 ring-primary/20 cursor-pointer" 
        : "bg-[#161618] border-white/10 hover:border-white/20 hover:bg-white/5 cursor-pointer")
    : "bg-[#161618] border-white/10"; // Display only style

  return (
    <div 
      onClick={variant === 'selectable' ? onClick : undefined}
      className={`${baseClasses} ${variantClasses}`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isSelected || (variant === 'display' && !isCurrent) ? 'text-white' : 'text-gray-200'}`}>
            {phase.title}
          </span>
          {isCurrent && (
            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded tracking-wide border border-primary/20">
              ATUAL
            </span>
          )}
        </div>
        {isSelected && variant === 'selectable' && (
           <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        )}
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">
        {phase.fullDescription}
      </p>
    </div>
  );
};