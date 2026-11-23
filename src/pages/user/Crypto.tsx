import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bitcoin, CalendarDays, CalendarRange, PieChart } from 'lucide-react';
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
  { id: 'portfolio', label: 'Portafolio Cripto', shortLabel: 'Portafolio', icon: PieChart },
  { id: 'day', label: 'Day Trading', shortLabel: 'Day', icon: CalendarDays },
  { id: 'swing', label: 'Swing Trading', shortLabel: 'Swing', icon: CalendarRange },
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
      <h1 className="text-2xl md:text-3xl font-extrabold text-brand-green-light flex items-center gap-3 mb-4 md:mb-6">
        <Bitcoin className="w-7 h-7 md:w-8 md:h-8" />
        Inversiones Cripto
      </h1>

      <div role="tablist" aria-label="Secciones de inversiones cripto" className="flex gap-1 overflow-x-auto overflow-y-hidden mb-6 md:mb-8 border-b border-surface-border">
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-brand-green-light text-brand-green-light' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              <Icon size={16} />
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
