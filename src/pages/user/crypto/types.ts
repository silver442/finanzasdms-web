export type PositionStatus = 'WATCHLIST' | 'BOUGHT' | 'SOLD';
export type Currency = 'USD' | 'MXN';
export type ReferenceMode = 'DAY' | 'SWING';
export type TradingMode = 'DAY' | 'SWING';

export interface CryptoTrade {
  id: string;
  type: 'BUY' | 'SELL';
  source: 'MANUAL' | 'AUTOMATED';
  quantity: string;
  price: string;
  total: string;
  executedAt: string;
}

export interface CryptoPosition {
  symbol: string;
  status: PositionStatus;
  quantity: string;
  averageBuyPrice: string;
  allocatedCapital: string;
  referencePrice: string | null;
  referenceDate: string | null;
  lastOperationDate: string | null;
  trades: CryptoTrade[];
}

export interface PortfolioResponse {
  positions: CryptoPosition[];
  usdBalance: number;
}

export const POPULAR_COINS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SHIB', 'UNI', 'PEPE', 'ONDO', 'SUI', 'VIRTUAL', 'AAVE', 'HBAR', 'PENGU'];
