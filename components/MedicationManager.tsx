import React, { useState, useRef, useEffect } from 'react';
import { Medication } from '../types';

interface MedicationManagerProps {
  medications: Medication[];
  onToggleActive: (id: string) => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onAddMore: () => void;
  onClose: () => void;
}

export const MedicationManager: React.FC<MedicationManagerProps> = ({ 
  medications, 
  onToggleActive, 
  onEdit,
  onDelete,
  onAddMore,
  onClose
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

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
          case 'inactive': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
          case 'completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          default: return 'text-gray-400';
      }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'active': return 'Ativo';
          case 'inactive': return 'Inativo';
          case 'completed': return 'Concluído';
          default: return status;
      }
  };

  return (
    <div className="w-full max-w-lg px-4 flex flex-col items-start gap-6 animate-enter pb-10">
      <div className="w-full space-y-2 mb-2">
        <h2 className="text-2xl font-bold text-white">Controle de Remédio</h2>
        <p className="text-gray-400 text-sm">Gerencie o que você está tomando.</p>
      </div>

      <div className="w-full space-y-3" ref={menuRef}>
        {medications.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
            Nenhum remédio cadastrado.
          </div>
        ) : (
          medications.map(med => (
            <div key={med.id} className="relative w-full flex items-center justify-between p-4 bg-[#161618] border border-white/10 rounded-xl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className={`font-medium ${med.status === 'inactive' ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {med.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(med.status)}`}>
                        {getStatusLabel(med.status)}
                    </span>
                </div>
                <span className="text-xs text-gray-500">
                  {med.frequency === 'daily' ? 'Diário' : 'Recorrente'} • {med.timesPerDay}x dia
                </span>
                <span className="text-xs text-gray-400 font-medium mt-1">
                  tratamento: {med.dosesTaken}/{med.totalDosesPlanned}
                </span>
              </div>
              
              {/* 3-Dot Menu Button */}
              <button
                onClick={() => setActiveMenuId(activeMenuId === med.id ? null : med.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {activeMenuId === med.id && (
                <div className="absolute right-4 top-12 z-20 w-40 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[scaleIn_0.1s_ease-out]">
                  {med.status !== 'completed' && (
                      <button
                        onClick={() => handleMenuAction(() => onToggleActive(med.id))}
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        {med.status === 'active' ? 'Desativar' : 'Ativar'}
                      </button>
                  )}
                  <button
                    onClick={() => handleMenuAction(() => onEdit(med))}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    {med.status === 'completed' ? 'Reativar/Editar' : 'Editar'}
                  </button>
                  <button
                    onClick={() => handleMenuAction(() => onDelete(med.id))}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button
        onClick={onAddMore}
        className="w-full py-4 rounded-xl border border-white/10 text-primary hover:bg-primary/5 hover:border-primary/30 transition-all text-sm font-bold flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        ADICIONAR REMÉDIO/VITAMINA
      </button>

      <button
        onClick={onClose}
        className="w-full py-4 rounded-xl font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      >
        FECHAR
      </button>
    </div>
  );
};