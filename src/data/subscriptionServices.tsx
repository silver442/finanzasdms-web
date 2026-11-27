import type { ReactNode } from 'react';

// Catálogo de servicios de suscripción con sus logos en SVG (viewBox 24×24).
// Los logos son versiones simplificadas con los colores de cada marca; se pintan sobre
// un mosaico de color `bg` desde components/ServiceLogo.tsx.

export type ServiceCategory = 'IA' | 'Streaming' | 'Nube y software' | 'Otros';

export const SERVICE_CATEGORIES: ServiceCategory[] = ['IA', 'Streaming', 'Nube y software', 'Otros'];

export interface SubscriptionService {
  id: string;
  name: string;
  category: ServiceCategory;
  bg: string;            // color (o gradiente CSS) del mosaico
  match: RegExp;         // reconoce el servicio en nombres guardados, ej. "Netflix Premium"
  keywords?: string[];   // términos extra para el buscador del selector
  mark: ReactNode;
}

const FONT = 'Inter, "Segoe UI", Arial, sans-serif';

// Texto centrado para los logos que son marca de palabra
function word(text: string, size: number, fill = '#FFFFFF', weight = 800, italic = false) {
  return (
    <text
      x="12" y="12.5" textAnchor="middle" dominantBaseline="central"
      fontFamily={FONT} fontSize={size} fontWeight={weight} fontStyle={italic ? 'italic' : 'normal'}
      fill={fill} letterSpacing="-0.3"
    >
      {text}
    </text>
  );
}

const W = '#FFFFFF';

export const SUBSCRIPTION_SERVICES: SubscriptionService[] = [
  // ─── IA ────────────────────────────────────────────────────────────────────
  {
    id: 'claude', name: 'Claude', category: 'IA', bg: '#D97757', match: /claude|anthropic/i, keywords: ['anthropic'],
    mark: (
      <g fill={W}>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
          <rect key={deg} x="11.1" y={i % 2 ? 4.5 : 2.8} width="1.8" height={i % 2 ? 7.5 : 9.2} rx="0.9" transform={`rotate(${deg} 12 12)`} />
        ))}
      </g>
    ),
  },
  {
    id: 'gemini', name: 'Gemini', category: 'IA', bg: '#131314', match: /gemini|bard/i, keywords: ['google ai'],
    mark: (
      <>
        <defs>
          <linearGradient id="svc-gemini" x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4796E3" />
            <stop offset="0.6" stopColor="#9177C7" />
            <stop offset="1" stopColor="#CA6673" />
          </linearGradient>
        </defs>
        <path fill="url(#svc-gemini)" d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" />
      </>
    ),
  },
  {
    id: 'chatgpt', name: 'ChatGPT / OpenAI', category: 'IA', bg: '#10A37F', match: /chat ?gpt|openai/i, keywords: ['openai', 'gpt'],
    mark: (
      <g fill="none" stroke={W} strokeWidth="1.6">
        {[0, 60, 120].map((deg) => (
          <ellipse key={deg} cx="12" cy="12" rx="8.5" ry="3.6" transform={`rotate(${deg} 12 12)`} />
        ))}
      </g>
    ),
  },
  {
    id: 'midjourney', name: 'Midjourney', category: 'IA', bg: '#0B0B0B', match: /midjourney/i,
    mark: (
      <g fill={W}>
        <path d="M11.2 3.5v12H4.8z" />
        <path d="M12.6 6.5v9h5.6z" />
        <path d="M3.5 17h17l-2.2 3H5.7z" />
      </g>
    ),
  },
  {
    id: 'perplexity', name: 'Perplexity', category: 'IA', bg: '#1F1F1F', match: /perplexity/i,
    mark: (
      <path
        fill="none" stroke="#20B8CD" strokeWidth="1.6" strokeLinejoin="round"
        d="M12 2.5v19M5 4.5l7 5.5 7-5.5V10H5zM5 10v8l7-5.5M19 10v8l-7-5.5"
      />
    ),
  },
  {
    id: 'copilot', name: 'GitHub Copilot', category: 'IA', bg: '#0D1117', match: /copilot/i, keywords: ['github'],
    mark: (
      <>
        <path fill="none" stroke={W} strokeWidth="1.7" strokeLinejoin="round" d="M4 12.5C4 7.8 6.6 5 12 5s8 2.8 8 7.5V16c0 2-3.6 4-8 4s-8-2-8-4z" />
        <rect x="7" y="11" width="3.2" height="3.6" rx="1.2" fill={W} />
        <rect x="13.8" y="11" width="3.2" height="3.6" rx="1.2" fill={W} />
      </>
    ),
  },
  {
    id: 'cursor', name: 'Cursor', category: 'IA', bg: '#0B0B0B', match: /cursor/i,
    mark: (
      <g fill="none" stroke={W} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z" />
        <path d="M3.5 7.25L12 12v9.5M12 12l8.5-4.75" />
      </g>
    ),
  },

  // ─── Streaming ─────────────────────────────────────────────────────────────
  {
    id: 'netflix', name: 'Netflix', category: 'Streaming', bg: '#000000', match: /netflix/i,
    mark: <path fill="#E50914" d="M7 3h3.2l3.6 10V3H17v18h-3.2l-3.6-10v10H7z" />,
  },
  {
    id: 'spotify', name: 'Spotify', category: 'Streaming', bg: '#191414', match: /spotify/i,
    mark: (
      <>
        <circle cx="12" cy="12" r="10" fill="#1DB954" />
        <g fill="none" stroke="#191414" strokeLinecap="round">
          <path strokeWidth="1.9" d="M6.4 9.3c3.8-1.2 8.1-.9 11.3.9" />
          <path strokeWidth="1.6" d="M7.1 12.5c3.1-.9 6.6-.6 9.3.9" />
          <path strokeWidth="1.3" d="M7.8 15.5c2.5-.6 5.1-.4 7.3.7" />
        </g>
      </>
    ),
  },
  {
    id: 'youtube', name: 'YouTube Premium', category: 'Streaming', bg: '#0F0F0F', match: /youtube/i,
    mark: (
      <>
        <rect x="2" y="5.5" width="20" height="13" rx="4" fill="#FF0000" />
        <path fill={W} d="M10 9v6l5.2-3z" />
      </>
    ),
  },
  {
    id: 'disney', name: 'Disney+', category: 'Streaming', bg: '#0E1A5B', match: /disney/i,
    mark: (
      <>
        <path fill="none" stroke="#3EE6F5" strokeWidth="1.1" strokeLinecap="round" d="M3 14.5C6 7.5 15 5.5 21 9.5" />
        {word('D+', 9.5)}
      </>
    ),
  },
  {
    id: 'max', name: 'Max (HBO)', category: 'Streaming', bg: '#002BE7', match: /\bmax\b|hbo/i, keywords: ['hbo'],
    mark: word('max', 9),
  },
  {
    id: 'prime', name: 'Amazon Prime', category: 'Streaming', bg: '#00A8E1', match: /prime|amazon/i, keywords: ['prime video'],
    mark: (
      <>
        <text x="12" y="11" textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize="7.2" fontWeight="800" fill={W}>prime</text>
        <path fill="none" stroke={W} strokeWidth="1.2" strokeLinecap="round" d="M5.5 15c3.8 2.3 9.2 2.3 13 0M17 14.1l1.6.9-1.2 1.5" />
      </>
    ),
  },
  {
    id: 'appletv', name: 'Apple TV+', category: 'Streaming', bg: '#000000', match: /apple ?tv/i,
    mark: word('tv+', 10),
  },
  {
    id: 'applemusic', name: 'Apple Music', category: 'Streaming', bg: 'linear-gradient(135deg, #FA5C6F, #FA243C)', match: /apple ?music/i,
    mark: (
      <>
        <path fill="none" stroke={W} strokeWidth="1.8" strokeLinejoin="round" d="M9.2 17.5V7.2l9-2v10.3" />
        <circle cx="7" cy="17.5" r="2.2" fill={W} />
        <circle cx="16" cy="15.5" r="2.2" fill={W} />
      </>
    ),
  },
  {
    id: 'crunchyroll', name: 'Crunchyroll', category: 'Streaming', bg: '#F47521', match: /crunchyroll/i,
    mark: (
      <>
        <circle cx="12" cy="12" r="8" fill={W} />
        <circle cx="14.6" cy="10.4" r="4.6" fill="#F47521" />
        <circle cx="15.6" cy="9.4" r="1.6" fill={W} />
      </>
    ),
  },
  {
    id: 'twitch', name: 'Twitch', category: 'Streaming', bg: '#9146FF', match: /twitch/i,
    mark: (
      <>
        <path fill={W} d="M5.5 3L4 6.5V19h4v2.5h2.5L13 19h3.5l3.5-3.5V3z" />
        <path fill="#9146FF" d="M7 5h11v9.5L15.5 17H12l-2.5 2.5V17H7z" />
        <rect x="10.2" y="7.5" width="1.7" height="4.6" fill={W} />
        <rect x="14.4" y="7.5" width="1.7" height="4.6" fill={W} />
      </>
    ),
  },

  // ─── Nube y software ───────────────────────────────────────────────────────
  {
    id: 'icloud', name: 'iCloud+', category: 'Nube y software', bg: '#3693F3', match: /icloud/i, keywords: ['apple'],
    mark: <path fill={W} d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.6 4.2 4.2 0 0 1 17.5 18z" />,
  },
  {
    id: 'googleone', name: 'Google One', category: 'Nube y software', bg: '#FFFFFF', match: /google ?one/i, keywords: ['drive'],
    mark: (
      <g fill="none" strokeWidth="2.6" strokeLinecap="round">
        <path stroke="#EA4335" d="M8.5 7.5L13 5" />
        <path stroke="#4285F4" d="M13 5v7" />
        <path stroke="#34A853" d="M13 12v7" />
        <path stroke="#FBBC04" d="M9.5 19h7" />
      </g>
    ),
  },
  {
    id: 'microsoft365', name: 'Microsoft 365', category: 'Nube y software', bg: '#1F1F1F', match: /microsoft|office|m365/i, keywords: ['office', 'word', 'excel'],
    mark: (
      <>
        <rect x="3" y="3" width="8.5" height="8.5" fill="#F25022" />
        <rect x="12.5" y="3" width="8.5" height="8.5" fill="#7FBA00" />
        <rect x="3" y="12.5" width="8.5" height="8.5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="8.5" height="8.5" fill="#FFB900" />
      </>
    ),
  },
  {
    id: 'adobe', name: 'Adobe Creative Cloud', category: 'Nube y software', bg: '#EB1000', match: /adobe|creative cloud/i, keywords: ['photoshop', 'illustrator'],
    mark: <path fill={W} d="M14.2 4H20v16zM9.8 4H4v16zM12 9.9L15.7 20h-2.5l-1.1-2.9H9.4z" />,
  },
  {
    id: 'notion', name: 'Notion', category: 'Nube y software', bg: '#FFFFFF', match: /notion/i,
    mark: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2.5" fill={W} stroke="#000000" strokeWidth="1.6" />
        <path fill="none" stroke="#000000" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="M8.6 16.5v-9l6.8 9v-9" />
      </>
    ),
  },
  {
    id: 'figma', name: 'Figma', category: 'Nube y software', bg: '#1E1E1E', match: /figma/i,
    mark: (
      <>
        <path fill="#F24E1E" d="M9 3h3v6H9a3 3 0 0 1 0-6z" />
        <path fill="#FF7262" d="M12 3h3a3 3 0 0 1 0 6h-3z" />
        <path fill="#A259FF" d="M9 9h3v6H9a3 3 0 0 1 0-6z" />
        <circle cx="15" cy="12" r="3" fill="#1ABCFE" />
        <path fill="#0ACF83" d="M9 15h3v3a3 3 0 1 1-3-3z" />
      </>
    ),
  },
  {
    id: 'vercel', name: 'Vercel', category: 'Nube y software', bg: '#000000', match: /vercel/i,
    mark: <path fill={W} d="M12 4.5l8.5 15h-17z" />,
  },
  {
    id: 'canva', name: 'Canva', category: 'Nube y software', bg: 'linear-gradient(135deg, #00C4CC, #7D2AE8)', match: /canva/i,
    mark: word('C', 15, W, 700, true),
  },
  {
    id: 'dropbox', name: 'Dropbox', category: 'Nube y software', bg: '#0061FF', match: /dropbox/i,
    mark: <path fill={W} d="M7 3.5L2 6.8 7 10l5-3.2zM17 3.5l-5 3.3 5 3.2 5-3.2zM2 13.2l5 3.2 5-3.2L7 10zM17 10l-5 3.2 5 3.2 5-3.2zM7 17.5l5 3.2 5-3.2-5-3.2z" />,
  },

  // ─── Otros ─────────────────────────────────────────────────────────────────
  {
    id: 'xbox', name: 'Xbox Game Pass', category: 'Otros', bg: '#107C10', match: /xbox|game ?pass/i,
    mark: (
      <g fill="none" stroke={W} strokeLinecap="round">
        <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" />
        <path strokeWidth="2" d="M8 7.5c2 1.6 6 6 8 9.3M16 7.5c-2 1.6-6 6-8 9.3" />
      </g>
    ),
  },
  {
    id: 'psplus', name: 'PlayStation Plus', category: 'Otros', bg: '#0070D1', match: /playstation|ps ?plus|\bpsn\b/i, keywords: ['ps plus', 'psn'],
    mark: <path fill="none" stroke="#FFC82C" strokeWidth="4.6" d="M12 4v16M4 12h16" />,
  },
  {
    id: 'nintendo', name: 'Nintendo Switch Online', category: 'Otros', bg: '#E60012', match: /nintendo|switch online/i,
    mark: (
      <>
        <rect x="5" y="3" width="6" height="18" rx="3" fill="none" stroke={W} strokeWidth="1.6" />
        <circle cx="8" cy="8" r="1.5" fill={W} />
        <path fill={W} d="M13 3h3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3z" />
        <circle cx="16" cy="14" r="1.5" fill="#E60012" />
      </>
    ),
  },
  {
    id: 'rappi', name: 'Rappi Pro', category: 'Otros', bg: '#FF441F', match: /rappi/i,
    mark: word('rappi', 7),
  },
  {
    id: 'uber', name: 'Uber One', category: 'Otros', bg: '#000000', match: /uber/i,
    mark: word('Uber', 7.5, W, 600),
  },
  {
    id: 'meli', name: 'Mercado Libre (Meli+)', category: 'Otros', bg: '#FFE600', match: /mercado ?libre|meli/i, keywords: ['meli+', 'mercado pago'],
    mark: word('meli+', 7, '#2D3277'),
  },
  {
    id: 'telmex', name: 'Telmex', category: 'Otros', bg: '#009FE3', match: /telmex|infinitum/i, keywords: ['internet', 'infinitum'],
    mark: word('telmex', 5.6),
  },
  {
    id: 'totalplay', name: 'Totalplay', category: 'Otros', bg: '#00A6A6', match: /total ?play/i, keywords: ['internet'],
    mark: word('totalplay', 4.6),
  },
  {
    id: 'telcel', name: 'Telcel', category: 'Otros', bg: '#0033A0', match: /telcel/i, keywords: ['celular', 'telefonía'],
    mark: word('telcel', 6),
  },
];

// Ícono genérico para servicios personalizados ("Otro") o no reconocidos
export const GENERIC_SERVICE_MARK: ReactNode = (
  <g fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12a7.5 7.5 0 0 1-13.1 5" />
    <path d="M4.5 12a7.5 7.5 0 0 1 13.1-5" />
    <path d="M17.8 3.5V7h-3.5M6.2 20.5V17h3.5" />
  </g>
);

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Servicio del catálogo cuyo nombre coincide exactamente (lo que guarda el selector)
export function getServiceByName(name: string): SubscriptionService | undefined {
  const n = normalize(name);
  return n ? SUBSCRIPTION_SERVICES.find((s) => normalize(s.name) === n) : undefined;
}

// Servicio reconocido dentro de un nombre libre (suscripciones antiguas o personalizadas)
export function findService(name: string): SubscriptionService | undefined {
  return getServiceByName(name) ?? SUBSCRIPTION_SERVICES.find((s) => s.match.test(name));
}

export function searchServices(query: string): SubscriptionService[] {
  const q = normalize(query);
  if (!q) return SUBSCRIPTION_SERVICES;
  return SUBSCRIPTION_SERVICES.filter((s) =>
    normalize(s.name).includes(q) || s.keywords?.some((k) => normalize(k).includes(q)));
}
