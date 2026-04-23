import React from 'react';

interface ProgressBarProps {
  total: number;
  completed: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ total, completed }) => {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-right text-xs font-medium text-gray-400">
        {completed}/{total} concluídas
      </div>
    </div>
  );
};