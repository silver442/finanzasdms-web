import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { ImageIcon, ImagePlus } from 'lucide-react';
import { LOAN_IMAGE_ACCEPT, validateLoanImage } from '../utils/loanImage';

interface LoanHeaderMediaProps {
  imageUrl?: string | null;
  concept: string;
  canEdit?: boolean;
  isUploading?: boolean;
  onUpload?: (file: File) => void;
}

// Imagen del préstamo en el encabezado del detalle. Solo los admins pueden subirla o cambiarla.
export default function LoanHeaderMedia({ imageUrl, concept, canEdit, isUploading, onUpload }: LoanHeaderMediaProps) {
  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!selected) return;
    const error = validateLoanImage(selected);
    if (error) {
      toast.error(error);
      return;
    }
    onUpload?.(selected);
  };

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      {imageUrl ? (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block group">
          <img
            src={imageUrl}
            alt={concept}
            loading="lazy"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-white/5 shadow-card group-hover:border-brand-green/30 transition-all"
          />
        </a>
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface-elevated/70 backdrop-blur-lg border border-white/5 flex items-center justify-center">
          <ImageIcon size={32} className="text-text-muted" />
        </div>
      )}

      {canEdit && (
        <label
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-green-light transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ImagePlus size={13} />
          {isUploading ? 'Subiendo...' : imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept={LOAN_IMAGE_ACCEPT} onChange={handleSelect} disabled={isUploading} className="hidden" />
        </label>
      )}
    </div>
  );
}
