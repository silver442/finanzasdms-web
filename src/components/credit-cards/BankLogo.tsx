import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { DEFAULT_CARD_COLOR, inferBankSlug } from '../../utils/creditCards';

interface BankLogoProps {
  name: string;
  bank?: string | null;
  color?: string;
  size?: 'sm' | 'md';
}

export default function BankLogo({ name, bank, color = DEFAULT_CARD_COLOR, size = 'md' }: BankLogoProps) {
  const slug = bank || inferBankSlug(name);
  const [failed, setFailed] = useState(false);
  const box = size === 'sm' ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-lg';

  if (!slug || failed) {
    return (
      <div
        className={`${box} flex items-center justify-center shrink-0 border`}
        style={{ backgroundColor: `${color}26`, borderColor: `${color}4D` }}
      >
        <CreditCard size={size === 'sm' ? 14 : 18} style={{ color }} />
      </div>
    );
  }

  return (
    <img
      src={`/banks/${slug}.png`}
      alt={name}
      onError={() => setFailed(true)}
      className={`${box} object-cover shrink-0 bg-surface-elevated`}
    />
  );
}
