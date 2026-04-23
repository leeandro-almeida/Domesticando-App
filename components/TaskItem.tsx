import React from 'react';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  // Parse text to separate "Title" from "Progress" if present
  // Format expectation: "Title — X/Y"
  const parts = task.text.split('—');
  const title = parts[0].trim();
  const progress = parts.length > 1 ? parts[1].trim() : null;

  return (
    <button
      onClick={() => !task.locked && onToggle(task.id)}
      disabled={task.locked}
      className={`
        group w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left
        ${task.completed 
          ? 'bg-primary/10 border-primary/30' 
          : task.locked
            ? 'bg-white/5 border-white/5 opacity-70 cursor-not-allowed'
            : 'bg-[#161618] border-white/10 hover:border-white/20 hover:bg-white/5'}
      `}
    >
      {/* Checkbox Visual */}
      <div className={`
        flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300
        ${task.completed
          ? 'bg-primary border-primary shadow-[0_0_10px_rgba(59,130,246,0.4)]'
          : task.locked
            ? 'bg-transparent border-gray-700'
            : 'bg-transparent border-gray-600 group-hover:border-gray-400'}
      `}>
        {task.completed && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {task.locked && !task.completed && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start w-full">
        <div className="flex items-center gap-2 w-full">
           <span className={`
            text-sm font-bold transition-colors duration-300 flex-1
            ${task.completed ? 'text-gray-300 line-through decoration-gray-500' : 'text-gray-200'}
            ${task.locked ? 'text-gray-500' : ''}
          `}>
            {title}
          </span>
          {progress && (
            <span className={`text-sm font-normal whitespace-nowrap ${task.locked || task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
              — {progress}
            </span>
          )}
        </div>
        
        {/* Medication Progress Subtext */}
        {task.subtext && (
            <span className={`text-[10px] font-medium mt-0.5 uppercase tracking-wide ${task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                {task.subtext}
            </span>
        )}

        {task.meta && (
          <span className={`text-xs font-medium mt-0.5 ${task.locked ? 'text-primary' : 'text-primary/70'}`}>
            {task.meta}
          </span>
        )}
      </div>
    </button>
  );
};