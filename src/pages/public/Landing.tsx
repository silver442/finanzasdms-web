import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, PlayCircle, ShieldCheck, Zap, Puzzle, Cloud, Menu, X, Check, ChevronDown,
  Landmark, CreditCard, CalendarCheck, Bitcoin, Wallet, Calculator, ChartColumnIncreasing,
  GraduationCap, HandCoins, TrendingUp, Star, Trophy, Lock,
} from 'lucide-react';
import './landing.css';

// Contenedor común: ancho máximo y margen lateral generoso
const WRAP = 'mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10';

const NAV = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'caracteristicas', label: 'Características' },
  { id: 'modulos', label: 'Módulos' },
  { id: 'planes', label: 'Planes' },
  { id: 'faq', label: 'Preguntas Frecuentes' },
];

const HIGHLIGHTS = [
  { Icon: ShieldCheck, title: 'Seguro y confiable', desc: 'Pagos SPEI validados uno a uno' },
  { Icon: Zap, title: 'Fácil de usar', desc: 'Control total en pocos clics' },
  { Icon: Puzzle, title: 'Modular y flexible', desc: 'Activa solo lo que necesitas' },
  { Icon: Cloud, title: 'En todos tus dispositivos', desc: 'Instálala como app en tu celular' },
];

const MODULES = [
  { Icon: Landmark, name: 'Préstamos Familiares', desc: 'Interés simple, cuotas fijas y abonos a capital que bajan tus pagos.', tone: 'from-emerald-500 to-emerald-700' },
  { Icon: CreditCard, name: 'Tarjetas de Crédito', desc: 'Fechas de corte, pago, MSI y crédito disponible en un vistazo.', tone: 'from-sky-500 to-blue-700' },
  { Icon: CalendarCheck, name: 'Suscripciones', desc: 'Tus gastos recurrentes bajo control, mes a mes.', tone: 'from-teal-400 to-cyan-700' },
  { Icon: Bitcoin, name: 'Portafolio Cripto', desc: 'Precios en vivo, rendimiento y bitácora de trading.', tone: 'from-amber-400 to-orange-600' },
  { Icon: Wallet, name: 'Cuentas e Inversiones', desc: 'Ahorro, renta fija y variable con cortes mensuales.', tone: 'from-violet-500 to-indigo-700' },
  { Icon: TrendingUp, name: 'Gana Dinero', desc: 'Oportunidades para generar ingresos extra.', tone: 'from-lime-400 to-emerald-600' },
];

const UPCOMING = [
  { Icon: GraduationCap, name: 'Academia' },
  { Icon: ChartColumnIncreasing, name: 'Bolsa de Valores' },
  { Icon: Calculator, name: 'Interés Compuesto' },
  { Icon: Wallet, name: 'Presupuesto' },
  { Icon: HandCoins, name: 'Deuda Externa' },
];

const LEVELS = [
  { name: 'Novato', pts: '0 pts', limit: '$500', rate: '50%', accent: 'text-text-primary' },
  { name: 'Cumplidor', pts: '300 pts', limit: '$2,000', rate: '45%', accent: 'text-brand-green-light' },
  { name: 'Socio', pts: '1,000 pts', limit: '$7,000', rate: '35%', accent: 'text-cyan-400' },
  { name: 'Élite', pts: 'Invitación', limit: '$15,000', rate: '25%', accent: 'text-amber-300' },
];

const EXPERIENCE = [
  'Patrimonio neto calculado en tiempo real',
  'Recordatorios por correo antes de cada vencimiento',
  'Pagos SPEI con comprobante validado por un administrador',
  'Alertas cripto en vivo para usuarios Premium',
];

const PLANS = [
  {
    name: 'Gratis', tagline: 'Ideal para comenzar', price: '$0', period: '/mes',
    features: ['Préstamos familiares con niveles', 'Tarjetas, suscripciones y cuentas', 'Portafolio cripto básico', 'Activa los módulos que quieras'],
    cta: 'Comenzar gratis', featured: false, soon: false,
  },
  {
    name: 'Premium Cripto', tagline: 'Para invertir con estrategia', price: '$99', period: 'MXN/mes',
    features: ['Todo lo del plan Gratis', 'Alertas Grid/DCA en tiempo real', 'Análisis de tendencia (EMA 200 · RSI 14)', 'Gratis para familia · 50% con referido'],
    cta: 'Obtener Premium', featured: true, soon: false,
  },
  {
    name: 'Pro', tagline: 'Aprende y diversifica', price: 'Pronto', period: '',
    features: ['Academia de finanzas con cursos', 'Bolsa de valores y ETFs', 'Simuladores de interés compuesto', 'Presupuesto y deuda externa'],
    cta: 'Próximamente', featured: false, soon: true,
  },
];

const FAQ = [
  { q: '¿Cashi es gratis?', a: 'Sí. Crear tu cuenta y usar los módulos públicos no cuesta nada. Solo el Bot Premium Cripto tiene costo mensual, y es gratis para familiares y con 50% de descuento si tienes código de referido.' },
  { q: '¿Cómo funcionan los préstamos?', a: 'Solicitas el monto y plazo, un administrador revisa y te propone condiciones, tú las aceptas y recibes la transferencia. Las cuotas son fijas con interés simple y cualquier abono extra reduce tus pagos futuros.' },
  { q: '¿Cómo pago mis cuotas?', a: 'Por transferencia SPEI a la cuenta indicada. Subes tu comprobante desde la app y, en cuanto se valida, tu cuota se marca como pagada.' },
  { q: '¿Cómo subo de nivel?', a: 'Cada cuota pagada a tiempo suma 10 puntos y cada préstamo liquidado 50 más. Con más puntos subes de Novato a Cumplidor y Socio, con mayor límite y menor tasa. El atraso resta niveles.' },
  { q: '¿Puedo desactivar un módulo?', a: 'Sí, desde la Tienda puedes activar o desactivar módulos cuando quieras. La única excepción son los préstamos: no se desactivan mientras tengas uno vigente.' },
];

// Variables CSS para retrasos/escalonado de animaciones
const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** Sección visible en pantalla, para resaltar el enlace del menú. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const NAV_IDS = NAV.map((n) => n.id);

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const active = useActiveSection(NAV_IDS);

  return (
    <div className="min-h-screen bg-surface-950 text-white font-sans selection:bg-brand-green/30 overflow-x-clip">

      {/* Brillos radiales de fondo */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="lp-drift absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-green-dark/[7%] rounded-full blur-[180px]" />
        <div className="lp-drift absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-700/[5%] rounded-full blur-[180px]" style={v({ '--dur': '24s' })} />
      </div>

      {/* --- HEADER --- */}
      <header className="lp-header fixed top-0 w-full z-[100] bg-surface-950/80 backdrop-blur-md border-b border-white/5">
        <nav className={`${WRAP} py-3 flex justify-between items-center`}>
          <a href="#inicio" className="shrink-0"><img src="/brand/cashi-logo.png" alt="Cashi" className="h-9 sm:h-10 w-auto" /></a>

          <div className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                data-active={active === n.id}
                className={`lp-navlink text-sm font-medium transition-colors ${active === n.id ? 'text-brand-green-light' : 'text-text-secondary hover:text-white'}`}
              >
                {n.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-text-primary hover:text-brand-green-light transition-colors">Iniciar Sesión</Link>
            <Link to="/register" className="lp-shine group flex items-center gap-1.5 text-sm font-bold bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-brand-green/20">
              Crear Cuenta <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <button className="lg:hidden text-text-secondary hover:text-white transition-colors p-2 -mr-2" onClick={() => setMenuOpen((o) => !o)} aria-label="Abrir menú" aria-expanded={menuOpen}>
            <span className="relative block w-6 h-6">
              <Menu size={24} className={`absolute inset-0 transition-all duration-300 ${menuOpen ? 'opacity-0 rotate-90 scale-50' : ''}`} />
              <X size={24} className={`absolute inset-0 transition-all duration-300 ${menuOpen ? '' : 'opacity-0 -rotate-90 scale-50'}`} />
            </span>
          </button>
        </nav>

        <div className="lp-collapse lg:hidden" data-open={menuOpen}>
          <div className="bg-surface-950/95 backdrop-blur-xl">
            <div className={`${WRAP} pb-5 pt-1 flex flex-col gap-1 border-t border-white/5`}>
              {NAV.map((n, i) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setMenuOpen(false)}
                  className={`text-base font-medium py-2.5 transition-all duration-300 ${active === n.id ? 'text-brand-green-light' : 'text-text-secondary'} ${menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                  style={{ transitionDelay: menuOpen ? `${i * 50}ms` : '0ms' }}
                >
                  {n.label}
                </a>
              ))}
              <div className="flex gap-3 pt-4 mt-2 border-t border-white/5">
                <Link to="/login" className="flex-1 text-center text-sm font-semibold text-text-primary border border-white/15 rounded-full py-3">Iniciar Sesión</Link>
                <Link to="/register" className="flex-1 text-center text-sm font-bold bg-brand-green hover:bg-brand-green-light text-white rounded-full py-3">Crear Cuenta</Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- HERO --- */}
      <section id="inicio" className="relative pt-24 sm:pt-28 lg:pt-36 pb-14 overflow-hidden">
        {/* Ondas verdes decorativas */}
        <div className="lp-drift absolute -top-32 -right-40 w-[42rem] h-[42rem] rounded-full bg-gradient-to-bl from-brand-green/25 via-teal-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="lp-drift absolute top-40 right-0 w-[60%] h-80 bg-gradient-to-tr from-transparent via-emerald-500/10 to-teal-400/20 rounded-[50%] blur-2xl pointer-events-none" style={v({ '--dur': '14s' })} />

        <div className={`${WRAP} relative grid lg:grid-cols-2 gap-10 lg:gap-12 items-center`}>
          <div className="text-center lg:text-left">
            <h1 className="text-[1.85rem] min-[400px]:text-[2.1rem] leading-[1.15] sm:text-5xl 2xl:text-6xl font-extrabold tracking-tight sm:leading-tight mb-5 sm:mb-6">
              <span className="lp-enter block text-balance" style={v({ '--d': '0.05s' })}>Organiza, controla y haz crecer tu dinero con</span>
              <span className="lp-enter lp-shimmer block text-6xl sm:text-7xl xl:text-8xl mt-1 sm:mt-2 pb-2" style={v({ '--d': '0.3s' })}>Cashi</span>
            </h1>
            <p className="lp-enter text-base sm:text-lg text-text-secondary mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed" style={v({ '--d': '0.45s' })}>
              Tu plataforma financiera todo en uno: préstamos familiares con gamificación, tarjetas, suscripciones,
              inversiones y cripto. Activa solo los módulos que necesitas.
            </p>
            <div className="lp-enter flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4" style={v({ '--d': '0.6s' })}>
              <Link to="/register" className="lp-shine lp-pulse group w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-8 py-4 rounded-full font-bold transition-colors">
                Comenzar gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#caracteristicas" className="group w-full sm:w-auto flex items-center justify-center gap-2 border border-white/15 hover:border-brand-green/50 hover:bg-white/5 text-white px-8 py-4 rounded-full font-bold transition-all">
                <PlayCircle size={20} className="group-hover:scale-110 group-hover:text-brand-green-light transition-all" /> Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="lp-enter relative" style={v({ '--d': '0.35s' })}>
            <div className="absolute inset-x-10 bottom-4 h-24 bg-brand-green/25 blur-3xl rounded-full lp-float" style={v({ '--dur': '6s' })} />
            <div className="lp-float" style={v({ '--dur': '6s' })}>
              <img
                src="/landing/laptop.webp"
                alt="Dashboard de Cashi en una laptop"
                width={1200}
                height={781}
                fetchPriority="high"
                className="relative w-full max-w-xl lg:max-w-2xl mx-auto drop-shadow-2xl lg:scale-115 lg:origin-left"
              />
            </div>
          </div>
        </div>

        {/* Franja de atributos */}
        <div className={`${WRAP} mt-12 sm:mt-16`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 lg:divide-x divide-white/10">
            {HIGHLIGHTS.map(({ Icon, title, desc }, i) => (
              <div key={title} className="lp-enter group flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-2 sm:gap-3 text-center sm:text-left lg:justify-center lg:px-4" style={v({ '--d': `${0.75 + i * 0.1}s` })}>
                <Icon strokeWidth={1.5} className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 text-brand-green-light group-hover:scale-110 group-hover:-rotate-6 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">{title}</p>
                  <p className="text-xs text-text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MÓDULOS --- */}
      <section id="modulos" className="py-16 sm:py-20 scroll-mt-16">
        <div className={`${WRAP} grid lg:grid-cols-[1fr_2fr] gap-10 items-start`}>
          <div className="lp-reveal-left lg:sticky lg:top-28 text-center lg:text-left">
            <SectionEyebrow>Módulos que se adaptan a ti</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">Herramientas para una mejor gestión financiera</h2>
            <p className="text-text-secondary mb-8">Activa desde la Tienda solo los módulos que necesitas y desactívalos cuando quieras. Tu menú se adapta a ti.</p>
            <Link to="/register" className="group inline-flex items-center gap-2 border border-brand-green/60 hover:bg-brand-green/10 hover:border-brand-green-light text-white text-sm font-bold px-6 py-3 rounded-full transition-all">
              Explorar módulos <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {MODULES.map(({ Icon, name, desc, tone }, i) => (
                <div key={name} className="lp-reveal" style={v({ '--i': i % 3 })}>
                  <div className="lp-card h-full flex sm:block items-start gap-4 bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-card">
                    <div className={`lp-icon shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${tone} flex items-center justify-center sm:mb-4 shadow-lg shadow-black/30`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary mb-1">{name}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-reveal mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 text-center lg:text-left">Próximamente</p>
              <div className="lp-marquee overflow-hidden">
                <div className="flex gap-2">
                  {[...UPCOMING, ...UPCOMING].map(({ Icon, name }, i) => (
                    <span key={i} aria-hidden={i >= UPCOMING.length} className="inline-flex items-center gap-1.5 shrink-0 text-xs text-text-secondary bg-surface-card/60 border border-white/5 px-3 py-1.5 rounded-full">
                      <Icon size={13} className="text-brand-green-light" /> {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- EXPERIENCIA (banner con modelo) --- */}
      <section id="caracteristicas" className="py-10 sm:py-12 scroll-mt-16">
        <div className={WRAP}>
          <div className="lp-reveal relative grid lg:grid-cols-2 rounded-3xl lg:rounded-[2rem] overflow-hidden border border-white/5 bg-gradient-to-br from-emerald-900/40 via-surface-card to-surface-card shadow-card">
            <div className="relative h-80 sm:h-96 lg:h-auto lg:min-h-[28rem] overflow-hidden">
              <img src="/landing/modelo.webp" alt="Mujer revisando sus finanzas en Cashi desde su celular" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-[center_30%] hover:scale-105 transition-transform duration-[1.5s]" />
              <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-transparent via-transparent to-surface-card" />

              {/* Tarjetas flotantes */}
              <div className="lp-float absolute top-4 left-4 lg:top-6 lg:left-6" style={v({ '--dur': '5s' })}>
                <div className="bg-surface-950/70 backdrop-blur-md border border-brand-green/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xl">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-brand-green/20 flex items-center justify-center text-brand-green-light"><TrendingUp size={20} /></div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-text-secondary">Tu patrimonio</p>
                    <p className="font-bold sm:text-lg leading-tight">$15,420.00</p>
                    <p className="text-[11px] sm:text-xs font-semibold text-brand-green-light">↑ +12.4%</p>
                  </div>
                </div>
              </div>
              <div className="lp-float absolute bottom-5 right-4 lg:bottom-6 lg:right-16" style={v({ '--dur': '6.5s', '--d': '-2s' })}>
                <div className="bg-surface-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-xl">
                  <div className="w-9 h-9 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300"><Trophy size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold">Pago puntual · +10 pts</p>
                    <p className="text-xs text-text-secondary">Subiste a Cumplidor</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
              <SectionEyebrow align="justify-start">Control total en tus manos</SectionEyebrow>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">Una experiencia simple, poderosa y segura</h2>
              <p className="text-text-secondary mb-6">Visualiza tu patrimonio, toma decisiones informadas y mejora tus condiciones de crédito pagando a tiempo.</p>
              <ul className="space-y-3">
                {EXPERIENCE.map((t, i) => (
                  <li key={t} className="lp-reveal-right flex items-start gap-3 text-sm sm:text-base text-text-primary" style={v({ '--i': i })}>
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full border border-brand-green-light/60 bg-brand-green/10 flex items-center justify-center text-brand-green-light"><Check size={12} strokeWidth={3} /></span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Niveles de crédito */}
          <div className="mt-14">
            <div className="lp-reveal flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 text-center md:text-left">
              <div>
                <SectionEyebrow align="justify-center md:justify-start">Gamificación de crédito</SectionEyebrow>
                <h3 className="text-2xl md:text-3xl font-bold">Tu puntualidad tiene recompensas</h3>
              </div>
              <p className="text-sm text-text-secondary max-w-md mx-auto md:mx-0">+10 puntos por cuota a tiempo y +50 al liquidar un préstamo. Más nivel = más límite y menor tasa.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {LEVELS.map((l, i) => (
                <div key={l.name} className="lp-reveal" style={v({ '--i': i })}>
                  <div className="lp-card h-full bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3 sm:mb-4">
                      <span className={`font-bold flex items-center gap-1.5 ${l.accent}`}>
                        {l.name === 'Élite' && <Star size={14} className="lp-icon fill-amber-300" />}{l.name}
                      </span>
                      <span className="self-start sm:self-auto text-[11px] text-text-muted bg-surface-base/60 px-2 py-0.5 rounded-full">{l.pts}</span>
                    </div>
                    <p className="text-xs text-text-muted">Límite</p>
                    <p className={`text-xl sm:text-2xl font-extrabold ${l.accent}`}>{l.limit}</p>
                    <p className="text-xs text-text-secondary mt-1">Tasa desde {l.rate}</p>
                    <div className="mt-3 h-1 rounded-full bg-surface-base/60 overflow-hidden">
                      <div className="lp-grow-x h-full rounded-full bg-gradient-to-r from-brand-green to-emerald-300" style={{ width: `${(i + 1) * 25}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- PLANES --- */}
      <section id="planes" className="py-16 sm:py-20 scroll-mt-16">
        <div className={`${WRAP} grid lg:grid-cols-[1fr_3fr] gap-10 items-center`}>
          <div className="lp-reveal-left text-center lg:text-left">
            <SectionEyebrow>Planes para cada etapa</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">Elige el plan ideal para ti</h2>
            <p className="text-text-secondary">Comienza gratis y desbloquea las herramientas avanzadas cuando las necesites.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-5 pt-3">
            {PLANS.map((p, i) => (
              <div key={p.name} className={`lp-reveal ${p.featured ? 'order-first md:order-none' : ''}`} style={v({ '--i': i })}>
                <div
                  className={`lp-card relative h-full flex flex-col rounded-2xl p-6 ${
                    p.featured
                      ? 'lp-border-spin shadow-[0_0_40px_rgba(16,185,129,0.18)] md:scale-[1.03]'
                      : 'bg-surface-card/60 backdrop-blur-md border border-white/5'
                  } ${p.soon ? 'opacity-75' : ''}`}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green-light text-surface-950 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg shadow-brand-green/30">Recomendado</span>
                  )}
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="text-sm text-text-secondary mb-4">{p.tagline}</p>
                  <p className="mb-5">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    {p.period && <span className="text-sm text-text-secondary ml-1">{p.period}</span>}
                  </p>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                        <Check size={16} className="mt-0.5 shrink-0 text-brand-green-light" /> {f}
                      </li>
                    ))}
                  </ul>
                  {p.soon ? (
                    <span className="flex items-center justify-center gap-2 text-sm font-bold text-text-muted border border-white/10 rounded-full py-3 cursor-not-allowed">
                      <Lock size={14} /> {p.cta}
                    </span>
                  ) : (
                    <Link
                      to="/register"
                      className={`lp-shine text-center text-sm font-bold rounded-full py-3 transition-all ${
                        p.featured
                          ? 'bg-brand-green hover:bg-brand-green-light text-white shadow-lg shadow-brand-green/20'
                          : 'border border-white/20 hover:border-brand-green/50 hover:bg-white/5 text-white'
                      }`}
                    >
                      {p.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-16 sm:py-20 scroll-mt-16">
        <div className={`${WRAP} grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-10`}>
          <div className="lp-reveal-left text-center lg:text-left">
            <SectionEyebrow>Resolvemos tus dudas</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">Preguntas frecuentes</h2>
            <p className="text-text-secondary">¿No encuentras lo que buscas? <Link to="/contact" className="text-brand-green-light hover:underline">Contáctanos</Link>.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="lp-reveal" style={v({ '--i': i })}>
                  <div className={`bg-surface-card/60 backdrop-blur-md border rounded-2xl transition-colors duration-300 ${open ? 'border-brand-green/30' : 'border-white/5 hover:border-white/15'}`}>
                    <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-text-primary" aria-expanded={open}>
                      {f.q}
                      <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-brand-green-light' : 'text-text-muted'}`} />
                    </button>
                    <div className="lp-collapse" data-open={open}>
                      <div><p className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">{f.a}</p></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-12 sm:py-16">
        <div className={WRAP}>
          <div className="lp-reveal relative overflow-hidden rounded-3xl lg:rounded-[2rem] border border-brand-green/20 bg-gradient-to-br from-emerald-700/25 to-surface-card p-8 sm:p-12 lg:p-14 grid md:grid-cols-[2fr_1fr] gap-8 items-center text-center md:text-left">
            <div className="lp-drift absolute -right-20 -top-20 w-72 h-72 rounded-full bg-brand-green/15 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">¿Listo para tomar el control de tu dinero?</h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto md:mx-0">Crea tu cuenta gratis en minutos y empieza a construir tu historial con Cashi.</p>
              <Link to="/register" className="lp-shine lp-pulse group inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-8 py-4 rounded-full font-bold transition-colors">
                Crear mi cuenta gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative flex items-end justify-center gap-3 h-28 md:h-40" aria-hidden>
              {[35, 55, 75, 100].map((h, i) => (
                <div key={h} className="lp-grow w-8 md:w-10 rounded-t-lg bg-gradient-to-t from-emerald-700 to-brand-green-light shadow-[0_0_25px_rgba(16,185,129,0.35)]" style={{ height: `${h}%`, ['--i' as string]: i }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-surface-950 border-t border-white/5 mt-8">
        <div className={`${WRAP} py-12 grid grid-cols-2 md:grid-cols-4 gap-8`}>
          <div className="col-span-2 md:col-span-1">
            <img src="/brand/cashi-logo.png" alt="Cashi" className="h-10 w-auto mb-3" />
            <p className="text-sm text-text-muted">Tu ecosistema financiero en un solo lugar.</p>
          </div>
          <FooterCol title="Producto" links={[['#caracteristicas', 'Características'], ['#modulos', 'Módulos'], ['#planes', 'Planes']]} />
          <FooterCol title="Soporte" links={[['#faq', 'Preguntas Frecuentes'], ['/contact', 'Contacto']]} />
          <FooterCol title="Legal" links={[['/terms', 'Términos de Servicio'], ['/privacy', 'Política de Privacidad']]} />
        </div>
        <div className="border-t border-white/5">
          <div className={`${WRAP} py-6 text-xs text-text-muted text-center sm:text-left`}>
            <span>&copy; {new Date().getFullYear()} Cashi. Todos los derechos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionEyebrow({ children, align = 'justify-center lg:justify-start' }: { children: ReactNode; align?: string }) {
  return (
    <p className={`flex items-center ${align} gap-3 text-xs font-semibold text-text-secondary mb-3`}>
      <span className="w-8 h-0.5 bg-brand-green-light rounded-full" />
      {children}
    </p>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-primary mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith('#')
              ? <a href={href} className="text-sm text-text-muted hover:text-brand-green-light transition-colors">{label}</a>
              : <Link to={href} className="text-sm text-text-muted hover:text-brand-green-light transition-colors">{label}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
