import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium text-gray-400 ml-1">
        {label}
      </label>
      <input
        className={`
          w-full bg-[#161618] text-gray-200 placeholder-gray-600 px-4 py-3 rounded-xl border
          transition-all duration-300 outline-none
          ${error 
            ? 'border-red-900/50 focus:border-red-800' 
            : 'border-white/10 hover:border-white/20 focus:border-primary focus:shadow-glow-sm'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400/80 ml-1 animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
};