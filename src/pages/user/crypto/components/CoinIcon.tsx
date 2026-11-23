import { useState } from 'react';
import { coinColor } from '../utils/coinColors';

const ICON_CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';

/** Logo de la moneda; si el CDN no lo tiene, muestra la inicial sobre el color de la moneda. */
export default function CoinIcon({ symbol, size }: { symbol: string; size: 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false);
  const dims = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  if (failed) {
    return (
      <div className={`${dims} shrink-0 rounded-full flex items-center justify-center font-bold text-white`} style={{ backgroundColor: coinColor(symbol) }}>
        {symbol.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={`${ICON_CDN}/${symbol.toLowerCase()}.svg`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${dims} shrink-0 rounded-full`}
    />
  );
}
