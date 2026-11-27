import { Play } from 'lucide-react';

// Colores de los servicios más comunes; los demás usan la inicial sobre el verde de la marca
interface ServiceStyle { bg: string; fg: string; glyph?: 'play' | string }

const KNOWN_SERVICES: { match: RegExp; style: ServiceStyle }[] = [
  { match: /netflix/i,            style: { bg: '#141414', fg: '#E50914', glyph: 'N' } },
  { match: /spotify/i,            style: { bg: '#1DB954', fg: '#0B0B0B', glyph: 'S' } },
  { match: /prime|amazon/i,       style: { bg: '#00A8E1', fg: '#FFFFFF', glyph: 'P' } },
  { match: /youtube/i,            style: { bg: '#FF0000', fg: '#FFFFFF', glyph: 'play' } },
  { match: /disney/i,             style: { bg: '#113CCF', fg: '#FFFFFF', glyph: 'D' } },
  { match: /hbo|max/i,            style: { bg: '#5822B4', fg: '#FFFFFF', glyph: 'M' } },
  { match: /apple/i,              style: { bg: '#1C1C1E', fg: '#FFFFFF', glyph: 'A' } },
  { match: /xbox|game ?pass/i,    style: { bg: '#107C10', fg: '#FFFFFF', glyph: 'X' } },
  { match: /playstation|ps ?plus/i, style: { bg: '#0070D1', fg: '#FFFFFF', glyph: 'P' } },
  { match: /chatgpt|openai/i,     style: { bg: '#10A37F', fg: '#FFFFFF', glyph: 'G' } },
  { match: /icloud|google one/i,  style: { bg: '#3B82F6', fg: '#FFFFFF', glyph: 'C' } },
];

export function ServiceLogo({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const style = KNOWN_SERVICES.find((s) => s.match.test(name))?.style;
  const dim = size === 'lg' ? 'w-14 h-14 text-2xl rounded-2xl' : size === 'sm' ? 'w-8 h-8 text-sm rounded-lg' : 'w-10 h-10 text-base rounded-full';
  const glyph = style?.glyph ?? (name.trim().charAt(0).toUpperCase() || '?');

  if (!style) {
    return (
      <div className={`${dim} shrink-0 flex items-center justify-center font-black bg-brand-green/15 border border-brand-green/25 text-brand-green-light`}>
        {glyph}
      </div>
    );
  }
  return (
    <div
      className={`${dim} shrink-0 flex items-center justify-center font-black shadow-lg shadow-black/30`}
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {glyph === 'play' ? <Play size={size === 'lg' ? 22 : 14} fill="currentColor" /> : glyph}
    </div>
  );
}
