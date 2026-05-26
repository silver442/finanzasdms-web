import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ArrowRight, Sparkles, Wallet, Trophy, Store, ChevronRight, Activity, Star, Users, LineChart, PieChart, BookOpen, Menu, X } from 'lucide-react';

const LEVELS = [
  {
    id: 'novato', label: 'Novato', Icon: Activity,
    limit: '$500', rate: '50%', term: '6 meses', pts: '0 pts',
    tabActive: 'bg-slate-700 border-slate-600 text-white',
    tabInactive: 'border-transparent text-slate-500 hover:text-slate-300',
    accent: 'text-slate-300',
    panelBg: 'bg-slate-800/60 border-slate-700',
  },
  {
    id: 'cumplidor', label: 'Cumplidor', Icon: Activity,
    limit: '$2,000', rate: '45%', term: '12 meses', pts: '300 pts',
    tabActive: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    tabInactive: 'border-transparent text-slate-500 hover:text-emerald-400',
    accent: 'text-emerald-400',
    panelBg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'socio', label: 'Socio', Icon: Activity,
    limit: '$7,000', rate: '35%', term: '18 meses', pts: '1,000 pts',
    tabActive: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
    tabInactive: 'border-transparent text-slate-500 hover:text-cyan-400',
    accent: 'text-cyan-400',
    panelBg: 'bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'elite', label: 'Élite', Icon: Star,
    limit: '$15,000', rate: '25%', term: '24 meses', pts: 'Invitación',
    tabActive: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    tabInactive: 'border-transparent text-slate-500 hover:text-amber-400',
    accent: 'text-amber-400',
    panelBg: 'bg-amber-500/10 border-amber-500/30',
  },
] as const;

const METRICS = [
  { label: 'Préstamos Activos', value: '3',       progress: 75, bar: 'from-emerald-500 to-emerald-400' },
  { label: 'Próximo Pago',      value: '$1,200',  progress: 40, bar: 'from-amber-500 to-amber-400' },
  { label: 'Puntos Acumulados', value: '850 pts', progress: 60, bar: 'from-violet-500 to-violet-400' },
];

export default function Landing() {
  const [activeLevel, setActiveLevel] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const level = LEVELS[activeLevel];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">

      {/* Círculos decorativos de fondo */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-[100] bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 transition-all">
        <nav className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-md shadow-emerald-500/10">
              <Landmark className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Finanzas<span className="text-emerald-400">DMS</span></span>
          </div>

          {/* Links de escritorio */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              Crear Cuenta
            </Link>
          </div>

          {/* Botón hamburguesa — solo móvil */}
          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50 px-6 py-4 flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all text-center"
            >
              Crear Cuenta
            </Link>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-32 lg:pt-28 lg:pb-60 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">

          {/* Announcement pill */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <a href="#features" className="group inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 text-sm font-semibold px-4 py-2 rounded-full transition-all">
              <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> NEW
              </span>
              Gamificación financiera v2 ya disponible
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">JD</div>
                <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">AM</div>
                <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">RS</div>
                <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-slate-400">
                  <Users size={12} />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Únete a la nueva <span className="text-slate-400">era financiera</span></p>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 max-w-5xl mx-auto leading-[1.1]">
            Eleva tus finanzas al <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">Siguiente Nivel</span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Una plataforma diseñada para gestionar préstamos, gamificar tu historial crediticio y desbloquear módulos financieros exclusivos. Todo respaldado por confianza y tecnología.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto mb-24">
            <Link to="/register" className="group flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] w-full sm:w-auto">
              Comenzar mi viaje <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all border border-slate-700 w-full sm:w-auto">
              Acceder a mi cuenta
            </Link>
          </div>

          {/* Mockup del Dashboard — con datos vivos */}
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/30 via-cyan-500/10 to-transparent blur-3xl -z-10 opacity-60 animate-pulse"></div>
            <div className="w-full overflow-x-auto pb-4 snap-x">
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800/50 shadow-2xl overflow-hidden min-w-[700px] aspect-[16/9] md:aspect-[21/9] lg:aspect-[16/7] flex">

              {/* Sidebar */}
              <div className="w-16 md:w-60 border-r border-slate-800/50 bg-slate-950/50 p-4 hidden md:flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0"></div>
                  <div className="h-4 w-24 bg-slate-800 rounded"></div>
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`flex items-center gap-3 px-2 py-1.5 rounded-lg ${i === 1 ? 'bg-emerald-500/10' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg shrink-0 ${i === 1 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-800/50'}`}></div>
                    <div className={`h-2.5 w-28 rounded ${i === 1 ? 'bg-emerald-500/30' : 'bg-slate-800/50'}`}></div>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 overflow-hidden bg-slate-900/50 flex flex-col gap-4">

                {/* Header con balance real */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-xs mb-1 tracking-widest uppercase">Balance Total</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-white text-2xl md:text-3xl font-bold">$15,420.00</span>
                      <span className="text-emerald-400 text-sm font-semibold">↑ +12.4%</span>
                    </div>
                  </div>
                  <div className="h-8 w-28 bg-emerald-500/20 rounded-xl border border-emerald-500/20 hidden md:block"></div>
                </div>

                {/* Tarjetas de métricas */}
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {METRICS.map(({ label, value, progress, bar }) => (
                    <div key={label} className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl flex flex-col justify-between">
                      <p className="text-slate-500 text-[10px] md:text-xs font-medium mb-1 truncate">{label}</p>
                      <p className="text-white text-base md:text-xl font-bold mb-3">{value}</p>
                      <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${bar} rounded-full`} style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráfica de barras con neón */}
                <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-semibold">Historial de Pagos</span>
                    <span className="text-slate-600 text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">Últimos 10 meses</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16 md:h-20">
                    {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-emerald-500/40 to-emerald-500/5 border-t-2 border-emerald-400 rounded-t w-full"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            </div>{/* /overflow-x-auto wrapper */}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID (Bento Box) --- */}
      <section id="features" className="py-24 bg-slate-900/50 border-y border-slate-800/50 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Un ecosistema financiero <span className="text-emerald-400">modular</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Activa solo las herramientas que necesitas. Gana puntos, sube de nivel y mejora tus condiciones.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* Préstamos Familiares */}
            <div className="group h-full bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all hover:border-emerald-500/50 relative overflow-hidden flex flex-col justify-between">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="85%" cy="15%" r="50" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="1"/>
                <circle cx="85%" cy="15%" r="85" fill="none" stroke="rgba(16,185,129,0.07)" strokeWidth="1"/>
                <circle cx="85%" cy="15%" r="120" fill="none" stroke="rgba(16,185,129,0.04)" strokeWidth="1"/>
              </svg>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform group-hover:[filter:drop-shadow(0_0_10px_rgba(16,185,129,0.5))]">
                <Wallet size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Préstamos Familiares</h3>
                <p className="text-slate-400 leading-relaxed">Gestión clara y transparente de créditos con tasas justas e interés simple. Diseñado para fortalecer la confianza familiar sin las complicaciones de la banca tradicional.</p>
              </div>
            </div>

            {/* Screener de Señales Cripto */}
            <div className="group h-full bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all hover:border-cyan-500/50 relative overflow-hidden flex flex-col justify-between">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="85%" cy="15%" r="50" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="1"/>
                <circle cx="85%" cy="15%" r="85" fill="none" stroke="rgba(6,182,212,0.07)" strokeWidth="1"/>
                <circle cx="85%" cy="15%" r="120" fill="none" stroke="rgba(6,182,212,0.04)" strokeWidth="1"/>
              </svg>
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform group-hover:[filter:drop-shadow(0_0_10px_rgba(6,182,212,0.5))]">
                <LineChart size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Screener de Señales Cripto</h3>
                <p className="text-slate-400 leading-relaxed">No es un bot automático. Es tu programa de alertas técnicas personalizadas analizando EMA, RSI y Estocástico en tiempo real.</p>
              </div>
            </div>

            {/* Portafolio Bursátil */}
            <div className="group h-full bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all hover:border-blue-500/50 relative overflow-hidden flex flex-col justify-between">
              <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="lines-portfolio" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5"/>
                  </pattern>
                </defs>
                <rect fill="url(#lines-portfolio)" width="100%" height="100%" />
              </svg>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform group-hover:[filter:drop-shadow(0_0_10px_rgba(59,130,246,0.5))]">
                <PieChart size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Portafolio Bursátil</h3>
                <p className="text-slate-400 leading-relaxed">Seguimiento preciso de tus acciones, ETFs y diversificación de patrimonio.</p>
              </div>
            </div>

            {/* Academia FinanzasDMS */}
            <div className="group h-full bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all hover:border-violet-500/50 relative overflow-hidden flex flex-col justify-between">
              <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="lines-academia" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5"/>
                  </pattern>
                </defs>
                <rect fill="url(#lines-academia)" width="100%" height="100%" />
              </svg>
              <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 border border-violet-500/20 text-violet-400 group-hover:scale-110 transition-transform group-hover:[filter:drop-shadow(0_0_10px_rgba(139,92,246,0.5))]">
                <BookOpen size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Academia FinanzasDMS</h3>
                <p className="text-slate-400 leading-relaxed">Aprende a invertir desde cero. Módulo de cursos y calculadoras de interés compuesto. <span className="text-violet-400/70">(Próximamente)</span></p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- GAMIFICATION SHOWCASE — simulador interactivo --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Tu comportamiento <span className="text-amber-400">tiene recompensas</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Selecciona un nivel y descubre qué condiciones te esperan.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
              {LEVELS.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setActiveLevel(i)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
                    activeLevel === i ? l.tabActive : l.tabInactive
                  }`}
                >
                  <l.Icon size={15} className={activeLevel === i && l.id === 'elite' ? 'fill-amber-400' : ''} />
                  <span className="hidden sm:inline">{l.label}</span>
                </button>
              ))}
            </div>

            {/* Panel de detalle */}
            <div className={`rounded-2xl border p-8 transition-all duration-300 ${level.panelBg}`}>
              <div className="flex items-center gap-2 mb-6">
                <level.Icon size={18} className={`${level.accent} ${level.id === 'elite' ? 'fill-amber-400' : ''}`} />
                <span className={`font-bold text-lg ${level.accent}`}>{level.label}</span>
                <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">{level.pts}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Límite de crédito</p>
                  <p className={`text-3xl md:text-4xl font-extrabold ${level.accent}`}>{level.limit}</p>
                </div>
                <div className="border-x border-slate-700/50">
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Tasa de interés</p>
                  <p className={`text-3xl md:text-4xl font-extrabold ${level.accent}`}>{level.rate}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Plazo máximo</p>
                  <p className={`text-3xl md:text-4xl font-extrabold ${level.accent}`}>{level.term}</p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-700/40 flex items-center justify-between">
                <p className="text-slate-500 text-sm">
                  {level.id === 'elite'
                    ? 'Nivel por invitación manual del administrador.'
                    : `Requiere ${level.pts} de puntos acumulados por pagos puntuales.`}
                </p>
                <Link to="/register" className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all border ${level.id === 'elite' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'}`}>
                  Comenzar →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-[3rem] p-10 md:p-20 text-center border border-emerald-500/20 relative overflow-hidden">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">¿Listo para tomar el control?</h2>
            <p className="text-xl text-emerald-100/80 mb-10 max-w-2xl mx-auto relative z-10">
              Únete a la plataforma que está revolucionando la forma en que gestionamos nuestras finanzas.
            </p>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-emerald-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl relative z-10">
              Crear mi cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800/50 mt-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-xl font-bold text-slate-300">Finanzas<span className="text-emerald-400">DMS</span></span>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacidad</Link>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">Términos</Link>
              <Link to="/contact" className="hover:text-slate-300 transition-colors">Contacto</Link>
            </div>
            <div className="text-slate-600 text-sm">
              &copy; {new Date().getFullYear()} FinanzasDMS. Proyecto Privado.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
