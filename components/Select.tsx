import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, value, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label className="text-xs font-medium text-gray-400 ml-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          className={`
            w-full bg-[#161618] text-gray-200 px-4 py-3 rounded-xl border appearance-none cursor-pointer
            transition-all duration-300 outline-none
            ${value === '' ? 'text-gray-600' : 'text-gray-200'}
            ${error 
              ? 'border-red-900/50 focus:border-red-800' 
              : 'border-white/10 hover:border-white/20 focus:border-primary focus:shadow-glow-sm'}
          `}
          {...props}
        >
          <option value="" disabled>Selecione</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-[#161618] text-gray-200">
              {opt}
            </option>
          ))}
        </select>
        {/* Custom Arrow Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
       {error && (
        <span className="text-xs text-red-400/80 ml-1">
          {error}
        </span>
      )}
    </div>
  );
};