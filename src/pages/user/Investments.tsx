import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  TrendingUp, ExternalLink, Star, Zap, X, Send, Copy, Bitcoin,
} from 'lucide-react';

interface ReferralCard {
  id: string;
  brand: string;
  title: string;
  description: string;
  code: string;
  link: string;
}

const CARD_STYLES = [
  { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     accent: 'text-sky-400',     badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { bg: 'bg-brand-green/10', border: 'border-brand-green/30', accent: 'text-brand-green-light', badge: 'bg-brand-green/20 text-brand-green-light border-brand-green/30' },
  { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  accent: 'text-purple-400',  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  accent: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { bg: 'bg-brand-violet/10',   border: 'border-brand-violet/30',   accent: 'text-brand-violet',   badge: 'bg-brand-violet/20 text-brand-violet border-brand-violet/30' },
  { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    accent: 'text-rose-400',    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export default function Investments() {
  const [cards, setCards] = useState<ReferralCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showReportModal, setShowReportModal] = useState(false);
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get<ReferralCard[]>(`${API}/referral-cards`, { headers: authHeaders() });
      setCards(data);
    } catch {
      toast.error('No se pudieron cargar las tarjetas de referidos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCards(); }, [fetchCards]);

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  const handleReport = async () => {
    if (!platform.trim()) {
      toast.error('Indica en qué plataforma invertiste');
      return;
    }
    setIsSending(true);
    try {
      const { data } = await axios.post<{ pointsEarned: number; totalPoints: number }>(
        `${API}/users/report-investment`,
        {},
        { headers: authHeaders() },
      );
      toast.success(`+${data.pointsEarned} puntos de confianza añadidos. Total: ${data.totalPoints} pts`);
      setShowReportModal(false);
      setPlatform('');
      setNotes('');
    } catch {
      toast.error('No se pudo registrar tu inversión');
    } finally {
      setIsSending(false);
    }
  };

  const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';

  return (
    <div className="p-8 text-white font-sans max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <TrendingUp size={32} className="text-brand-green-light" />
          Gana Dinero
        </h1>
        <p className="text-text-secondary mt-2">
          Plataformas recomendadas para hacer crecer tu patrimonio
        </p>
      </div>

      {/* ── Banner de gamificación cruzada ── */}
      <div className="mb-8 bg-brand-green/10 border border-brand-green/30 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-green/20 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-brand-green-light" />
        </div>
        <div className="flex-1">
          <p className="text-brand-green-light font-bold">¿Ya invertiste? Súbete de nivel en FinanzasDMS</p>
          <p className="text-brand-green-light/70 text-sm mt-0.5">
            Envía tu comprobante y gana <strong>+10 puntos de confianza</strong> para avanzar en el sistema de niveles.
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="shrink-0 flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
        >
          <Send size={16} />
          Reportar Inversión
        </button>
      </div>

      {/* ── Catálogo de tarjetas ── */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando plataformas...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay tarjetas de referidos publicadas aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map((card, idx) => {
            const style = CARD_STYLES[idx % CARD_STYLES.length];
            return (
              <div
                key={card.id}
                className={`${style.bg} border ${style.border} rounded-2xl p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform`}
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center shrink-0">
                    <TrendingUp size={22} className={style.accent} />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-base leading-tight">{card.brand}</h3>
                    <p className={`text-xs mt-0.5 font-semibold ${style.accent}`}>{card.title}</p>
                  </div>
                </div>

                {/* Descripción */}
                <div className="flex gap-2.5 flex-1">
                  <Star size={14} className="text-brand-violet shrink-0 mt-0.5" />
                  <p className="text-text-primary text-xs leading-relaxed">{card.description}</p>
                </div>

                {/* Código de referido */}
                <button
                  onClick={() => copyCode(card.code)}
                  className={`flex items-center justify-between gap-2 border rounded-xl px-4 py-2.5 transition-colors hover:opacity-80 ${style.badge}`}
                >
                  <span className="font-mono font-bold text-sm tracking-wider">{card.code}</span>
                  <Copy size={14} className="shrink-0 opacity-70" />
                </button>

                {/* CTA */}
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-surface-card hover:bg-surface-elevated border border-surface-border hover:border-surface-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <ExternalLink size={15} />
                  Ver Promoción
                </a>
              </div>
            );
          })}

          {/* Cripto — Próximamente */}
          <div className="relative bg-surface-card/50 border border-surface-border/50 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
              <span className="bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Próximamente
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
                <Bitcoin size={22} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base">Cripto</h3>
                <p className="text-xs text-orange-400 font-semibold">Portafolio de criptomonedas</p>
              </div>
            </div>
            <p className="text-text-secondary text-xs">Próximamente podrás registrar y rastrear tu portafolio cripto.</p>
            <button disabled className="flex items-center justify-center gap-2 bg-surface-elevated border border-surface-border text-text-muted px-4 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed">
              Ver Cripto
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Reportar Inversión ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex justify-between items-center p-6 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-brand-green-light" />
                Reportar Inversión
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-4 text-sm">
                <p className="text-brand-green-light font-bold mb-0.5">+10 puntos de confianza</p>
                <p className="text-brand-green-light/70">
                  Al reportar tu inversión, recibirás puntos que te ayudarán a subir de nivel y obtener mejores condiciones de crédito.
                </p>
              </div>

              <div>
                <label className="block text-sm text-text-primary font-medium mb-1.5">
                  ¿En qué plataforma invertiste? <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={inputCls}
                  placeholder="Ej: Cetes Directo, Bitso, Nu..."
                />
              </div>

              <div>
                <label className="block text-sm text-text-primary font-medium mb-1.5">
                  Notas adicionales <span className="text-text-muted">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputCls} resize-none h-24`}
                  placeholder="Monto aproximado, tipo de instrumento, etc."
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t border-surface-border flex gap-3 justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleReport()}
                disabled={isSending}
                className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                <Send size={15} />
                {isSending ? 'Enviando...' : 'Enviar y ganar puntos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
