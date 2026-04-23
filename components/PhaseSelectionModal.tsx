import React, { useState } from 'react';
import { PhaseDetail, SymptomLevel } from '../types';

interface PhaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: PhaseDetail[];
  currentPhaseId: SymptomLevel;
  onConfirmPhaseChange: (phaseId: SymptomLevel) => void;
}

export const PhaseSelectionModal: React.FC<PhaseSelectionModalProps> = ({
  isOpen,
  onClose,
  phases,
  currentPhaseId,
  onConfirmPhaseChange,
}) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<SymptomLevel>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handlePhaseClick = (id: SymptomLevel) => {
    if (id === currentPhaseId) return;
    setSelectedPhaseId(id);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedPhaseId !== null) {
      onConfirmPhaseChange(selectedPhaseId);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setShowConfirmation(false);
    setSelectedPhaseId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={resetAndClose}
      />

      {/* Card */}
      <div className="relative bg-[#111113] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-bold text-white">
            {showConfirmation ? 'Confirmar mudança' : 'Selecione a Fase'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-5">
          {!showConfirmation ? (
            <div className="space-y-3">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => handlePhaseClick(phase.id)}
                  className={`
                    w-full flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left
                    ${phase.id === currentPhaseId 
                      ? 'bg-primary/10 border-primary/50 cursor-default' 
                      : 'bg-[#161618] border-white/5 hover:border-white/20 hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-sm font-bold ${phase.id === currentPhaseId ? 'text-primary' : 'text-gray-200'}`}>
                      {phase.title}
                    </span>
                    {phase.id === currentPhaseId && (
                      <span className="text-[10px] uppercase font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">Atual</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {phase.description}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Mudar de fase pode alterar sua lista de tarefas do dia atual.
                <br /><br />
                Deseja realmente ir para a <span className="text-primary font-bold">{phases.find(p => p.id === selectedPhaseId)?.title}</span>?
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={showConfirmation ? () => setShowConfirmation(false) : resetAndClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            {showConfirmation ? 'Cancelar' : 'Fechar'}
          </button>
          
          {showConfirmation && (
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-primary shadow-glow hover:bg-blue-600 transition-all"
            >
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};