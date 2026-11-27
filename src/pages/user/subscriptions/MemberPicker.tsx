import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Copy, RefreshCw, Search, UserCheck, UserX, X } from 'lucide-react';
import { API, authHeaders, apiMessage, type PickedMember } from './subscriptionUtils';

interface MemberPickerProps {
  members: PickedMember[];
  onChange: (members: PickedMember[]) => void;
  // Correos que ya son miembros de la suscripción (no se pueden volver a invitar)
  existingEmails?: string[];
}

type Notice = { kind: 'notFound' | 'error'; message: string } | null;

// Solo se puede compartir con usuarios registrados: cada correo se verifica contra la API antes de agregarse
export default function MemberPicker({ members, onChange, existingEmails = [] }: MemberPickerProps) {
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const search = async () => {
    const email = input.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setNotice({ kind: 'error', message: 'Escribe un correo válido.' }); return; }
    if (members.some((m) => m.email === email)) { setNotice({ kind: 'error', message: 'Esa persona ya está en la lista.' }); return; }
    if (existingEmails.includes(email)) { setNotice({ kind: 'error', message: 'Esa persona ya es miembro de esta suscripción.' }); return; }

    setSearching(true);
    setNotice(null);
    try {
      const { data } = await axios.get<PickedMember>(`${API}/shared-subscriptions/lookup-member`, {
        headers: authHeaders(),
        params: { email },
      });
      onChange([...members, data]);
      setInput('');
    } catch (e) {
      const notFound = axios.isAxiosError(e) && e.response?.status === 404;
      setNotice({
        kind: notFound ? 'notFound' : 'error',
        message: apiMessage(e) ?? 'No se pudo verificar el correo. Intenta de nuevo.',
      });
    } finally {
      setSearching(false);
    }
  };

  const copyRegisterLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register`);
      toast.success('Enlace de registro copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="email" placeholder="Correo de la persona en Cashi" value={input}
            onChange={(e) => { setInput(e.target.value); setNotice(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }}
            className="w-full bg-surface-base/70 border border-surface-border text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted"
          />
        </div>
        <button
          type="button" onClick={() => void search()} disabled={searching || !input.trim()}
          className="bg-brand-green hover:bg-brand-green-light text-white font-semibold px-4 rounded-xl transition-colors shrink-0 disabled:opacity-50 flex items-center gap-2"
        >
          {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      {notice?.kind === 'notFound' && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex gap-3">
          <UserX size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-sm font-semibold">Usuario no encontrado</p>
            <p className="text-text-secondary text-xs mt-0.5">{notice.message}</p>
            <button
              type="button" onClick={() => void copyRegisterLink()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <Copy size={13} /> Copiar enlace de registro para enviárselo
            </button>
          </div>
        </div>
      )}
      {notice?.kind === 'error' && <p className="text-red-400 text-xs">{notice.message}</p>}

      {members.length > 0 && (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.email} className="flex items-center gap-3 bg-brand-green/5 border border-brand-green/20 rounded-xl px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-brand-green/20 text-brand-green-light font-bold text-sm flex items-center justify-center shrink-0">
                {(m.name ?? m.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate flex items-center gap-1.5">
                  {m.name ?? m.email} <UserCheck size={13} className="text-brand-green-light shrink-0" />
                </p>
                {m.name && <p className="text-xs text-text-muted truncate">{m.email}</p>}
              </div>
              <button
                type="button" onClick={() => onChange(members.filter((x) => x.email !== m.email))}
                aria-label={`Quitar ${m.email}`} className="p-1 text-text-muted hover:text-red-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
