import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      {/* Modal Card */}
      <div className="relative bg-[#111113] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`
              flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-glow transition-all
              ${variant === 'danger' ? 'bg-red-500/80 hover:bg-red-500' : 'bg-primary hover:bg-blue-600'}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};