import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DangerConfirmModalProps {
  title: string;
  confirmLabel: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}

// Confirmación de acciones destructivas e irreversibles (borrar moneda, reiniciar portafolio)
export default function DangerConfirmModal({ title, confirmLabel, isSubmitting, onConfirm, onClose, children }: DangerConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div role="alertdialog" aria-modal="true" aria-label={title} className="bg-surface-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <span className="bg-red-500/10 border border-red-500/20 rounded-xl p-2">
              <AlertTriangle size={20} className="text-red-400" />
            </span>
            {title}
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3 text-sm text-text-secondary">{children}</div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6 pt-4 border-t border-surface-border">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 bg-surface-elevated hover:bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white py-2.5 rounded-xl transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
