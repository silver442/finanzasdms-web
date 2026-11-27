import { forwardRef, useState } from 'react';
import { Eye, TrendingDown, TrendingUp } from 'lucide-react';
import type { CryptoPosition, ReferenceMode } from './types';
import TradeForm, { type TradePreset, type TradeType } from './TradeForm';
import WatchlistForm from './WatchlistForm';

export type PanelTab = 'BUY' | 'SELL' | 'WATCHLIST';

interface TradePanelProps {
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  positions: CryptoPosition[];
  usdBalance: number;
  livePrices: Record<string, number>;
  referenceMode: ReferenceMode;
  tradePreset: TradePreset | null;
  watchlistEditing: CryptoPosition | null;
  onCancelWatchlistEdit: () => void;
  onSaved: () => void;
}

// Comprar y Vender llevan su acento de color (verde / rojo); Enlistar usa el verde de acción
const TABS: { value: PanelTab; label: string; icon: typeof Eye; activeClass: string; iconClass: string }[] = [
  { value: 'BUY', label: 'Comprar', icon: TrendingUp, activeClass: 'border-brand-green-light text-white bg-brand-green/10', iconClass: 'text-brand-green-light' },
  { value: 'SELL', label: 'Vender', icon: TrendingDown, activeClass: 'border-red-500 text-white bg-red-500/10', iconClass: 'text-red-400' },
  { value: 'WATCHLIST', label: 'Enlistar moneda', icon: Eye, activeClass: 'border-brand-green-light text-white bg-brand-green/10', iconClass: 'text-brand-green-light' },
];

/** Panel fijo de operación (estilo exchange): registra compras/ventas y enlista monedas sin abrir modales. */
const TradePanel = forwardRef<HTMLElement, TradePanelProps>(function TradePanel(
  { tab, onTabChange, positions, usdBalance, livePrices, referenceMode, tradePreset, watchlistEditing, onCancelWatchlistEdit, onSaved },
  ref,
) {
  const isTrade = tab !== 'WATCHLIST';
  // Al volver de "Enlistar moneda" el formulario conserva la última operación (Comprar o Vender)
  const [tradeType, setTradeType] = useState<TradeType>(tab === 'SELL' ? 'SELL' : 'BUY');
  if (isTrade && tab !== tradeType) setTradeType(tab);

  return (
    <section ref={ref} aria-label="Panel de operación" className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card overflow-hidden scroll-mt-4">
      <div role="tablist" aria-label="Acciones del portafolio" className="grid grid-cols-3 border-b border-white/5 bg-surface-base/40">
        {TABS.map(({ value, label, icon: Icon, activeClass, iconClass }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              id={`trade-panel-tab-${value}`}
              aria-selected={active}
              aria-controls={value === 'WATCHLIST' ? 'trade-panel-WATCHLIST' : 'trade-panel-TRADE'}
              onClick={() => onTabChange(value)}
              className={`flex items-center justify-center gap-1.5 px-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${active ? activeClass : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              <Icon size={16} className={`shrink-0 ${active ? iconClass : ''}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Ambas vistas quedan montadas para no perder lo capturado al alternar */}
      <div role="tabpanel" id="trade-panel-TRADE" aria-labelledby={`trade-panel-tab-${tradeType}`} hidden={!isTrade} className="px-4 py-3 md:px-5">
        <TradeForm type={tradeType} positions={positions} usdBalance={usdBalance} livePrices={livePrices} preset={tradePreset} onSaved={onSaved} />
      </div>
      <div role="tabpanel" id="trade-panel-WATCHLIST" aria-labelledby="trade-panel-tab-WATCHLIST" hidden={isTrade} className="px-4 py-3 md:px-5">
        <WatchlistForm
          key={watchlistEditing?.symbol ?? 'new'}
          positions={positions}
          referenceMode={referenceMode}
          editing={watchlistEditing}
          onCancelEdit={onCancelWatchlistEdit}
          onSaved={onSaved}
        />
      </div>
    </section>
  );
});

export default TradePanel;
