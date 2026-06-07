import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ShoppingBag, CheckCircle, Loader2, Lock, AlertTriangle, Landmark, Wallet, GraduationCap } from 'lucide-react';

type ModuleRestriction = { canDeactivate: boolean; reason: string | null };
type ModuleRestrictions = Partial<Record<keyof UserFlags, ModuleRestriction>>;

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

const COMING_SOON_MODULES: { name: string; desc: string; icon: React.ElementType }[] = [
  {
    name: 'Deuda Externa',
    desc: 'Registra y monitorea los préstamos personales que tienes fuera de la plataforma, como deudas con bancos, familiares o amigos.',
    icon: Landmark,
  },
  {
    name: 'Presupuesto',
    desc: 'Crea y gestiona presupuestos mensuales por categoría para tomar control total de tus ingresos y gastos.',
    icon: Wallet,
  },
  {
    name: 'Academia de Finanzas',
    desc: 'Aprende sobre finanzas personales, inversiones y crédito con cursos y guías interactivas diseñadas para ti.',
    icon: GraduationCap,
  },
];

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
  const [confirmKey, setConfirmKey] = useState<keyof UserFlags | null>(null);
  const [restrictions, setRestrictions] = useState<ModuleRestrictions>({});
  const role = getUserRole();
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    axios
      .get<ModuleRestrictions>(`${import.meta.env.VITE_API_URL}/users/me/module-restrictions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => setRestrictions(res.data))
      .catch(() => { /* sin restricciones si falla */ });
  }, []);

  const handleDeactivate = async (flagKey: keyof UserFlags) => {
    setLoading(flagKey);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/me/modules`,
        { [flagKey]: false },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );

      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem('user', JSON.stringify({ ...user, [flagKey]: false }));
      }

      setFlags((prev) => ({ ...prev, [flagKey]: false }));
      window.dispatchEvent(new Event('user-flags-updated'));
      toast.success('Módulo desactivado. Tus datos se mantienen intactos.');
    } catch {
      toast.error('No se pudo desactivar el módulo. Intenta de nuevo.');
    } finally {
      setLoading(null);
    }
  };

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
    <>
    <div className="p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6">
              <ShoppingBag size={48} className="text-violet-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Tienda de Módulos</h1>
          <p className="text-text-secondary text-lg">
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
            const restriction = restrictions[m.flagKey];
            const canDeactivate = !restriction || restriction.canDeactivate !== false;
            const deactivateTooltip = !canDeactivate
              ? (restriction?.reason ?? 'Debes liquidar tus préstamos activos antes de desactivar este módulo')
              : undefined;

            return (
              <div
                key={m.flagKey}
                className={`bg-surface-card border rounded-xl p-5 flex flex-col gap-3 transition-colors ${
                  isInstalled ? 'border-brand-green/30' : isSoon ? 'border-surface-border opacity-60' : 'border-surface-border'
                }`}
              >
                <div>
                  <p className="font-bold text-white mb-1">{m.name}</p>
                  <p className="text-text-secondary text-sm">{m.desc}</p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-green-light text-sm font-semibold">
                      <CheckCircle size={16} />
                      Instalado
                    </div>
                    <button
                      onClick={() => canDeactivate && setConfirmKey(m.flagKey)}
                      disabled={loading === m.flagKey || !canDeactivate}
                      title={deactivateTooltip}
                      className="text-text-muted hover:text-red-400 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading === m.flagKey ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Desactivar'
                      )}
                    </button>
                  </div>
                ) : isSoon ? (
                  <div className="flex items-center gap-2 text-text-muted text-sm font-semibold">
                    <Lock size={16} />
                    Próximamente
                  </div>
                ) : (
                  <button
                    onClick={() => void handleActivate(m.flagKey)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
                      isAdminTest
                        ? 'bg-brand-violet/10 border-brand-violet/30 hover:bg-brand-violet hover:border-brand-violet text-brand-violet hover:text-white'
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

        {/* Módulos en desarrollo */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-surface-elevated" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">En desarrollo</span>
            <div className="h-px flex-1 bg-surface-elevated" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMING_SOON_MODULES.map((m) => (
              <div
                key={m.name}
                className="bg-surface-card/50 border border-surface-border/50 rounded-xl p-5 flex flex-col gap-3 opacity-70"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-surface-elevated/50 rounded-xl p-2.5 shrink-0">
                    <m.icon size={20} className="text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1">{m.name}</p>
                    <p className="text-text-secondary text-sm">{m.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-text-muted text-sm font-semibold">
                  <Lock size={14} />
                  Próximamente
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Modal de confirmación de desactivación */}
    {confirmKey && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-brand-violet/10 border border-brand-violet/20 rounded-xl p-2">
              <AlertTriangle size={20} className="text-brand-violet" />
            </div>
            <h3 className="text-white font-bold text-lg">¿Desactivar módulo?</h3>
          </div>
          <p className="text-text-secondary text-sm mb-6">
            ¿Seguro que deseas ocultar este módulo? Tus datos guardados se mantendrán intactos y podrás reactivarlo en cualquier momento.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmKey(null)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-text-primary hover:text-white hover:bg-surface-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                void handleDeactivate(confirmKey);
                setConfirmKey(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all"
            >
              Sí, desactivar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
