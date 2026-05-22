import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ShoppingBag, CheckCircle, Loader2, Lock } from 'lucide-react';

type UserFlags = {
  hasCreditCardsModule: boolean;
  hasLoansModule: boolean;
  hasSubscriptionsModule: boolean;
  hasMakeMoneyModule: boolean;
  hasCryptoModule: boolean;
  hasStockMarketModule: boolean;
  hasCompoundInterestModule: boolean;
};

function getFlags(): UserFlags {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { hasCreditCardsModule: true, hasLoansModule: true, hasSubscriptionsModule: true, hasMakeMoneyModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false };
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      hasCreditCardsModule:     p.hasCreditCardsModule     !== false,
      hasLoansModule:           p.hasLoansModule           !== false,
      hasSubscriptionsModule:   p.hasSubscriptionsModule   !== false,
      hasMakeMoneyModule:       p.hasMakeMoneyModule       !== false,
      hasCryptoModule:          p.hasCryptoModule          === true,
      hasStockMarketModule:     p.hasStockMarketModule     === true,
      hasCompoundInterestModule: p.hasCompoundInterestModule === true,
    };
  } catch {
    return { hasCreditCardsModule: true, hasLoansModule: true, hasSubscriptionsModule: true, hasMakeMoneyModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false };
  }
}

function getUserRole(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const p = JSON.parse(raw) as Record<string, unknown>;
    return typeof p.role === 'string' ? p.role : '';
  } catch { return ''; }
}

const STORE_MODULES: { name: string; desc: string; flagKey: keyof UserFlags; isReleased: boolean }[] = [
  { name: 'Tarjetas de Crédito', desc: 'Registra y monitorea todas tus tarjetas de crédito.',          flagKey: 'hasCreditCardsModule',     isReleased: true  },
  { name: 'Préstamos',           desc: 'Solicita y gestiona préstamos familiares con gamificación.',    flagKey: 'hasLoansModule',            isReleased: true  },
  { name: 'Suscripciones',       desc: 'Controla tus gastos recurrentes y suscripciones mensuales.',   flagKey: 'hasSubscriptionsModule',    isReleased: true  },
  { name: 'Gana Dinero',         desc: 'Descubre oportunidades de inversión y genera ingresos extra.',  flagKey: 'hasMakeMoneyModule',        isReleased: true  },
  { name: 'Inversiones Cripto',  desc: 'Registra y monitorea tu portafolio de criptomonedas.',         flagKey: 'hasCryptoModule',           isReleased: false },
  { name: 'Bolsa de Valores',    desc: 'Seguimiento de acciones, ETFs y mercados bursátiles.',         flagKey: 'hasStockMarketModule',      isReleased: false },
  { name: 'Interés Compuesto',   desc: 'Simulador de crecimiento patrimonial a largo plazo.',          flagKey: 'hasCompoundInterestModule', isReleased: false },
];

export default function ModuleStore() {
  const [flags, setFlags] = useState<UserFlags>(getFlags);
  const [loading, setLoading] = useState<string | null>(null);
  const role = getUserRole();
  const isAdmin = role === 'ADMIN';

  const handleActivate = async (flagKey: keyof UserFlags) => {
    setLoading(flagKey);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/me/modules`,
        { [flagKey]: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );

      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem('user', JSON.stringify({ ...user, [flagKey]: true }));
      }

      setFlags((prev) => ({ ...prev, [flagKey]: true }));
      window.dispatchEvent(new Event('user-flags-updated'));
      toast.success('¡Módulo activado correctamente!');
    } catch {
      toast.error('No se pudo activar el módulo. Intenta de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6">
              <ShoppingBag size={48} className="text-violet-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Tienda de Módulos</h1>
          <p className="text-slate-400 text-lg">
            Activa módulos para personalizar tu experiencia financiera.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STORE_MODULES.map((m) => {
            const isInstalled = flags[m.flagKey];
            const isLoading = loading === m.flagKey;
            const canActivate = !isInstalled && (m.isReleased || isAdmin);
            const isAdminTest = canActivate && !m.isReleased && isAdmin;
            const isSoon = !isInstalled && !m.isReleased && !isAdmin;

            return (
              <div
                key={m.flagKey}
                className={`bg-slate-800 border rounded-xl p-5 flex flex-col gap-3 transition-colors ${
                  isInstalled ? 'border-emerald-500/30' : isSoon ? 'border-slate-700 opacity-60' : 'border-slate-700'
                }`}
              >
                <div>
                  <p className="font-bold text-white mb-1">{m.name}</p>
                  <p className="text-slate-400 text-sm">{m.desc}</p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle size={16} />
                    Instalado
                  </div>
                ) : isSoon ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                    <Lock size={16} />
                    Próximamente
                  </div>
                ) : (
                  <button
                    onClick={() => void handleActivate(m.flagKey)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
                      isAdminTest
                        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500 hover:border-amber-500 text-amber-300 hover:text-white'
                        : 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500 hover:border-violet-500 text-violet-300 hover:text-white'
                    }`}
                  >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? 'Activando...' : isAdminTest ? 'Probar (Admin)' : 'Activar Módulo'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
