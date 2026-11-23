import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bitcoin, CalendarDays, ChartLine, Layers, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import PortfolioTab from './crypto/PortfolioTab';
import DayTradingTab from './crypto/DayTradingTab';
import SwingTradingTab from './crypto/SwingTradingTab';
import { API, apiErrorMessage, authHeaders } from './crypto/utils/api';
import DangerConfirmModal from './crypto/components/DangerConfirmModal';
import { readPref, writePref } from './crypto/utils/storage';

type MarketState = 'LATERAL' | 'ALCISTA' | 'BAJISTA';

interface CryptoAlertPayload {
  symbol: string;
  marketState: MarketState;
  type: 'BUY' | 'SELL' | 'SUPPORT';
  stepPercent: number | null;
  currentPrice: number;
  breakEven: number;
  diagnosis: string | null;
  message: string;
}

const TABS = [
  { id: 'portfolio', label: 'Portafolio Cripto', shortLabel: 'Portafolio', icon: Layers },
  { id: 'day', label: 'Day Trading', shortLabel: 'Day', icon: CalendarDays },
  { id: 'swing', label: 'Swing Trading', shortLabel: 'Swing', icon: ChartLine },
] as const;

type TabId = (typeof TABS)[number]['id'];
const TAB_IDS = TABS.map((t) => t.id);

export default function Crypto() {
  const [activeTab, setActiveTab] = useState<TabId>(() => readPref('crypto.activeTab', TAB_IDS, 'portfolio'));
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [clearJournal, setClearJournal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  // Se incrementa tras reiniciar para remontar la pestaña activa y recargar sus datos
  const [resetVersion, setResetVersion] = useState(0);

  // Conexión WebSocket para alertas del bot Grid/DCA en tiempo real (usuarios Premium)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${API}/crypto`, { auth: { token } });

    socket.on('crypto-alert', (payload: CryptoAlertPayload) => {
      if (payload.type === 'SUPPORT') {
        toast.info(payload.message);
      } else if (payload.type === 'BUY') {
        toast.success(payload.message);
      } else {
        toast.warning(payload.message);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const closeReset = () => {
    setIsResetOpen(false);
    setClearJournal(false);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await axios.delete(`${API}/crypto/portfolio/reset`, { headers: authHeaders(), data: { clearJournal } });
      toast.success('Portafolio reiniciado a $0.00');
      closeReset();
      setResetVersion((v) => v + 1);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Error al reiniciar el portafolio'));
    } finally {
      setIsResetting(false);
    }
  };

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    writePref('crypto.activeTab', id);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 text-white font-sans max-w-7xl mx-auto relative">
      <header className="flex items-start justify-between gap-3 mb-5 md:mb-7">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Bitcoin className="w-10 h-10 md:w-14 md:h-14 shrink-0 text-brand-green-light" strokeWidth={2.5} />
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">Inversiones Cripto</h1>
            <p className="text-sm md:text-base text-text-secondary mt-1">Gestiona tu portafolio, operaciones y rendimiento en criptomonedas.</p>
          </div>
        </div>
        <button
          onClick={() => setIsResetOpen(true)}
          className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-red-400/70 hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/10 rounded-xl transition-colors p-2 sm:px-3 whitespace-nowrap"
          title="Borrar monedas, operaciones y efectivo"
          aria-label="Reiniciar portafolio"
        >
          <RotateCcw size={16} />
          <span className="hidden sm:inline">Reiniciar portafolio</span>
        </button>
      </header>

      <div role="tablist" aria-label="Secciones de inversiones cripto" className="flex gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden mb-6 md:mb-8 border-b border-brand-green/40">
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold whitespace-nowrap rounded-t-xl border border-b-0 transition-colors ${isActive ? 'bg-gradient-to-b from-brand-green/40 to-brand-green/10 border-brand-green/50 text-white' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              <Icon size={18} />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" key={resetVersion}>
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'day' && <DayTradingTab />}
        {activeTab === 'swing' && <SwingTradingTab />}
      </div>

      {isResetOpen && (
        <DangerConfirmModal
          title="¿Reiniciar portafolio?"
          confirmLabel="Sí, reiniciar a $0.00"
          isSubmitting={isResetting}
          onConfirm={handleReset}
          onClose={closeReset}
        >
          <p>Se borrarán de forma permanente:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Todas tus monedas (compradas, vendidas y en seguimiento)</li>
            <li>Todo el historial de operaciones</li>
            <li>Todos los depósitos y retiros: tu saldo disponible quedará en <span className="font-semibold text-text-primary">$0.00 USD</span></li>
          </ul>
          <label className="flex items-start gap-3 bg-surface-base/60 border border-surface-border rounded-lg px-3 py-2.5 cursor-pointer">
            <input type="checkbox" checked={clearJournal} onChange={(e) => setClearJournal(e.target.checked)} className="mt-0.5 accent-red-500" />
            <span>
              También borrar la bitácora de Day y Swing Trading
              <span className="block text-xs text-text-muted">Saldos corregidos, notas y metas semanales.</span>
            </span>
          </label>
          <p className="text-red-300">Esta acción no se puede deshacer.</p>
        </DangerConfirmModal>
      )}
    </div>
  );
}
