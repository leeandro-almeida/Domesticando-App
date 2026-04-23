import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';

interface MenuProps {
  onReset: () => void;
  onOpenMedications: () => void;
  onOpenEditTasks: () => void;
  timeBlockingEnabled: boolean;
  onToggleTimeBlocking: () => void;
}

export const Menu: React.FC<MenuProps> = ({
  onReset,
  onOpenMedications,
  onOpenEditTasks,
  timeBlockingEnabled,
  onToggleTimeBlocking
}) => {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/80 border border-white/10 text-primary hover:bg-white/5 transition-colors backdrop-blur-md shadow-lg"
        aria-label="Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#161618] border border-white/10 rounded-xl shadow-2xl overflow-hidden origin-top-right animate-[scaleIn_0.1s_ease-out]">
           
           {/* Time Blocking Toggle */}
           <div className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5">
             <div className="flex flex-col">
               <span className="text-sm text-gray-200">Bloqueio de horário</span>
               <span className="text-[10px] text-gray-500">{timeBlockingEnabled ? 'Ligado' : 'Desligado'}</span>
             </div>
             <button 
               onClick={onToggleTimeBlocking}
               className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${timeBlockingEnabled ? 'bg-primary' : 'bg-gray-700'}`}
             >
               <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${timeBlockingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
           </div>
           
           <button
            onClick={() => { onOpenEditTasks(); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Editar Tarefas
          </button>

           <button
            onClick={() => { onOpenMedications(); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3V4a1 1 0 0 1 1 1v5a4 4 0 0 1-8 0V5a1 1 0 0 1 1-1V2.3z"/>
              <path d="M8 15v6"/>
              <path d="M5 21h6"/>
            </svg>
            Controle de Remédio
          </button>
          
          <button
            onClick={() => { onReset(); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            Resetar tudo
          </button>

          <button
            onClick={() => { signOut(); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
};