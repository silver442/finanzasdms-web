import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bitcoin, CalendarDays, ChartLine, Layers } from 'lucide-react';
import { io } from 'socket.io-client';
import PortfolioTab from './crypto/PortfolioTab';
import DayTradingTab from './crypto/DayTradingTab';
import SwingTradingTab from './crypto/SwingTradingTab';
import { API } from './crypto/utils/api';
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

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    writePref('crypto.activeTab', id);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 text-white font-sans max-w-7xl mx-auto relative">
      <header className="flex items-center gap-3 md:gap-4 mb-5 md:mb-7">
        <Bitcoin className="w-10 h-10 md:w-14 md:h-14 shrink-0 text-brand-green-light" strokeWidth={2.5} />
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white">Inversiones Cripto</h1>
          <p className="text-sm md:text-base text-text-secondary mt-1">Gestiona tu portafolio, operaciones y rendimiento en criptomonedas.</p>
        </div>
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

      <div role="tabpanel">
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'day' && <DayTradingTab />}
        {activeTab === 'swing' && <SwingTradingTab />}
      </div>
    </div>
  );
}
