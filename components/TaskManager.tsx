import React, { useState, useRef, useEffect } from 'react';
import { CustomTask } from '../types';

interface TaskManagerProps {
  customTasks: CustomTask[];
  onEdit: (task: CustomTask) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onClose: () => void;
  systemTasks: { id: string; text: string; recurrence: string }[];
  disabledSystemTaskIds: string[];
  onToggleSystemTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
  customTasks, 
  onEdit, 
  onDelete, 
  onAdd, 
  onClose,
  systemTasks,
  disabledSystemTaskIds,
  onToggleSystemTask
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setActiveMenuId(null);
  };

  const getRecurrenceLabel = (task: CustomTask) => {
      switch(task.frequency) {
          case 'daily': return 'Diário';
          case 'weekly': return 'Semanal';
          case 'monthly': return `Dia ${task.monthDay} do mês`;
          case 'once': return 'Somente hoje';
          default: return '';
      }
  };

  return (
    <div className="w-full max-w-lg px-4 flex flex-col items-start gap-6 animate-enter pb-10">
      <div className="w-full space-y-2 mb-2">
        <h2 className="text-2xl font-bold text-white">Editar Tarefas</h2>
        <p className="text-gray-400 text-sm">Gerencie suas tarefas fixas e manuais.</p>
      </div>

      <div className="w-full space-y-3" ref={menuRef}>
        
        {/* System Tasks (Templates) */}
        {systemTasks.map(task => {
            const isDisabled = disabledSystemTaskIds.includes(task.id);
            if (isDisabled) return null; // If deleted, don't show or allow restore? Prompt says "Delete task", implying removal.

            return (
                <div key={task.id} className="relative w-full flex items-center justify-between p-4 bg-[#161618] border border-white/10 rounded-xl">
                    <div className="flex flex-col">
                        <span className="font-medium text-white">{task.text}</span>
                        <span className="text-xs text-gray-500">{task.recurrence}</span>
                    </div>
                    <button
                        onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                    </button>
                    {activeMenuId === task.id && (
                        <div className="absolute right-4 top-12 z-20 w-40 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[scaleIn_0.1s_ease-out]">
                            <div className="px-4 py-3 text-xs text-gray-500 border-b border-white/5">Tarefa Padrão</div>
                             <button
                                onClick={() => handleMenuAction(() => onToggleSystemTask(task.id))}
                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            )
        })}

        {/* Custom Tasks */}
        {customTasks.map(task => (
            <div key={task.id} className="relative w-full flex items-center justify-between p-4 bg-[#161618] border border-white/10 rounded-xl">
              <div className="flex flex-col">
                <span className="font-medium text-white">{task.name}</span>
                <span className="text-xs text-gray-500">{getRecurrenceLabel(task)} {task.hasSteps ? `• ${task.stepsQty} etapas` : ''}</span>
              </div>
              
              <button
                onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
              </button>

              {activeMenuId === task.id && (
                <div className="absolute right-4 top-12 z-20 w-40 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[scaleIn_0.1s_ease-out]">
                  <button
                    onClick={() => handleMenuAction(() => onEdit(task))}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleMenuAction(() => onDelete(task.id))}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
        ))}

        {customTasks.length === 0 && systemTasks.filter(t => !disabledSystemTaskIds.includes(t.id)).length === 0 && (
             <div className="p-6 text-center border border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                Nenhuma tarefa configurada.
             </div>
        )}
      </div>

      <button
        onClick={onAdd}
        className="w-full py-4 rounded-xl border border-white/10 text-primary hover:bg-primary/5 hover:border-primary/30 transition-all text-sm font-bold flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        ADICIONAR TAREFA
      </button>

      <button
        onClick={onClose}
        className="w-full py-4 rounded-xl font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      >
        VOLTAR
      </button>
    </div>
  );
};