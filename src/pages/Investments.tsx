import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  TrendingUp, ExternalLink, Star, Zap, X, Send,
  DollarSign, Shield, Bitcoin, Landmark, BarChart2, Wallet,
} from 'lucide-react';

interface InvestmentCard {
  id: string;
  name: string;
  tagline: string;
  benefit: string;
  bonus?: string;
  tip: string;
  color: string;
  borderColor: string;
  iconColor: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  url: string;
}

const INVESTMENTS: InvestmentCard[] = [
  {
    id: 'cetes',
    name: 'Cetes Directo',
    tagline: 'Deuda Gubernamental · Riesgo Cero',
    benefit: 'Gana hasta 11.25% anual garantizado',
    tip: 'La opción más segura del mercado. Uso BondeD para tener liquidez semanal sin perder rendimiento.',
    color: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    iconColor: 'text-sky-400',
    Icon: Landmark,
    url: 'https://www.cetesdirecto.com',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    tagline: 'Mercado Fondo · Inversión diaria',
    benefit: 'Tu dinero genera interés cada día automáticamente',
    bonus: 'Retiro instantáneo sin penalización',
    tip: 'Lo uso como fondo de emergencias. Genera rendimiento diario y puedo sacar el dinero en segundos cuando lo necesito.',
    color: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    iconColor: 'text-sky-300',
    Icon: Wallet,
    url: 'https://www.mercadopago.com.mx',
  },
  {
    id: 'bitso',
    name: 'Bitso',
    tagline: 'Criptomonedas · Bitso+',
    benefit: 'Gana hasta 8% APY en USDT (dólares digitales)',
    bonus: 'Obtén hasta $300 MXN al registrarte con referido',
    tip: 'Tengo una parte en USDT para protegerme de la inflación del peso. El rendimiento en Bitso+ llega solo, sin hacer nada.',
    color: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    Icon: Bitcoin,
    url: 'https://bitso.com',
  },
  {
    id: 'nu',
    name: 'Nu (Nubank)',
    tagline: 'Caja de Ahorro · Interés diario',
    benefit: 'Interés diario en tu cuenta — sin comisiones',
    bonus: 'Cuenta sin costo y sin saldo mínimo',
    tip: 'La uso como cuenta alterna para separar metas (viaje, emergencias, etc.). La app es la más bonita y simple que he probado.',
    color: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    iconColor: 'text-violet-400',
    Icon: DollarSign,
    url: 'https://nu.com.mx',
  },
  {
    id: 'flink',
    name: 'Flink',
    tagline: 'ETFs · Inversión en Bolsa',
    benefit: 'Invierte en ETFs desde $10 MXN',
    bonus: 'ETFs de S&P 500, Nasdaq y más desde tu celular',
    tip: 'Ideal para comenzar en bolsa sin complicaciones. Automaticé $200 semanales al S&P 500 y ni lo siento, pero sí se acumula.',
    color: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    Icon: BarChart2,
    url: 'https://flink.com.mx',
  },
  {
    id: 'bbva',
    name: 'BBVA Invest',
    tagline: 'Fondos bancarios · Baja barrera de entrada',
    benefit: 'Fondos de inversión desde tu banca móvil',
    bonus: 'Sin trámites extra si ya tienes cuenta BBVA',
    tip: 'Si ya tienes cuenta BBVA, el fondo BBVAINV es una opción cómoda. No es el más rentable, pero es conveniente y seguro.',
    color: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    iconColor: 'text-sky-300',
    Icon: Shield,
    url: 'https://www.bbva.mx',
  },
];

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export default function Investments() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const inputCls = 'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500';

  return (
    <div className="p-8 text-white font-sans max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <TrendingUp size={32} className="text-emerald-400" />
          Gana Dinero
        </h1>
        <p className="text-slate-400 mt-2">
          Plataformas recomendadas para hacer crecer tu patrimonio
        </p>
      </div>

      {/* ── Banner de gamificación cruzada ── */}
      <div className="mb-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-emerald-300 font-bold">¿Ya invertiste? Súbete de nivel en FinanzasDMS</p>
          <p className="text-emerald-400/70 text-sm mt-0.5">
            Envía tu comprobante y gana <strong>+20 puntos de confianza</strong> para avanzar en el sistema de niveles.
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="shrink-0 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Send size={16} />
          Reportar Inversión
        </button>
      </div>

      {/* ── Catálogo de tarjetas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {INVESTMENTS.map((inv) => (
          <div
            key={inv.id}
            className={`${inv.color} border ${inv.borderColor} rounded-2xl p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform`}
          >
            {/* Card header */}
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0`}>
                <inv.Icon size={22} className={inv.iconColor} />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base leading-tight">{inv.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{inv.tagline}</p>
              </div>
            </div>

            {/* Benefit */}
            <div className="bg-slate-900/60 rounded-xl px-4 py-3">
              <p className={`font-bold text-sm ${inv.iconColor}`}>{inv.benefit}</p>
              {inv.bonus && (
                <p className="text-slate-400 text-xs mt-1">✦ {inv.bonus}</p>
              )}
            </div>

            {/* Tip de Silvestre */}
            <div className="flex gap-2.5">
              <Star size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-400 font-bold mb-0.5">Tip</p>
                <p className="text-slate-300 text-xs leading-relaxed">{inv.tip}</p>
              </div>
            </div>

            {/* CTA */}
            <a
              href={inv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              <ExternalLink size={15} />
              Ver Promoción
            </a>
          </div>
        ))}
      </div>

      {/* ── Modal: Reportar Inversión ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-emerald-400" />
                Reportar Inversión
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm">
                <p className="text-emerald-300 font-bold mb-0.5">+20 puntos de confianza</p>
                <p className="text-emerald-400/70">
                  Al reportar tu inversión, recibirás puntos que te ayudarán a subir de nivel y obtener mejores condiciones de crédito.
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1.5">
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
                <label className="block text-sm text-slate-300 font-medium mb-1.5">
                  Notas adicionales <span className="text-slate-500">(opcional)</span>
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
            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleReport()}
                disabled={isSending}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
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
