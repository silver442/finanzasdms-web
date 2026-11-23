// Colores de marca de las monedas más comunes; el resto toma uno de la paleta de respaldo
const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  HBAR: '#0EA5E9',
  XRP: '#94A3B8',
  BNB: '#F3BA2F',
  ADA: '#3468D1',
  DOGE: '#C2A633',
  USDT: '#26A17B',
  USDC: '#2775CA',
  AVAX: '#E84142',
  DOT: '#E6007A',
  LINK: '#2A5ADA',
  SUI: '#4DA2FF',
  PEPE: '#4C9540',
};

const FALLBACK_COLORS = ['#10B981', '#8B5CF6', '#F59E0B', '#38BDF8', '#F472B6', '#A3E635', '#FB7185'];

export function coinColor(symbol: string) {
  if (COIN_COLORS[symbol]) return COIN_COLORS[symbol];
  const hash = Array.from(symbol).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
