import { useEffect, useMemo, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { LOAN_IMAGE_ACCEPT, validateLoanImage } from '../utils/loanImage';

interface LoanImageInputProps {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  disabled?: boolean;
}

export default function LoanImageInput({ file, onChange, label = 'Imagen / comprobante (opcional)', disabled }: LoanImageInputProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!selected) return;
    const error = validateLoanImage(selected);
    if (error) {
      toast.error(error);
      return;
    }
    onChange(selected);
  };

  return (
    <div>
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{label}</p>
      {file && previewUrl ? (
        <div className="flex items-center gap-3 bg-surface-elevated/70 backdrop-blur-lg border border-white/5 rounded-xl p-2">
          <img src={previewUrl} alt="Vista previa" className="w-12 h-12 rounded-lg object-cover shrink-0" />
          <p className="text-sm text-text-primary truncate flex-1 min-w-0">{file.name}</p>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            aria-label="Quitar imagen"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className={`flex items-center justify-center gap-2 border border-dashed border-surface-border hover:border-brand-green/40 rounded-xl px-4 py-3 text-sm text-text-secondary hover:text-brand-green-light transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <ImagePlus size={16} />
          Seleccionar imagen (máx. 5 MB)
          <input type="file" accept={LOAN_IMAGE_ACCEPT} onChange={handleSelect} disabled={disabled} className="hidden" />
        </label>
      )}
    </div>
  );
}
