import { formatMoney } from '../utils/format';

export function ResultValue({ value, className = '' }: { value: number | null; className?: string }) {
  if (value === null) return <span className={`text-text-muted ${className}`}>—</span>;
  const color = value > 0 ? 'text-brand-green-light' : value < 0 ? 'text-red-400' : 'text-text-secondary';
  return <span className={`font-bold tabular-nums ${color} ${className}`}>{value > 0 ? '+' : ''}{formatMoney(value)}</span>;
}
