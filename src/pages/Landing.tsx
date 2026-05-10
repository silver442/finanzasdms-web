import { Link } from 'react-router-dom';
import { Landmark, ArrowRight, ShieldCheck, PieChart, Wallet, Bitcoin } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-emerald-500/30">
      
      {/* Círculos decorativos de fondo (blur) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-md shadow-emerald-500/10">
            <Landmark className="h-6 w-6 text-emerald-400" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Finanzas<span className="text-emerald-400">DMS</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link 
            to="/register" 
            className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Crear Cuenta
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
          <ShieldCheck size={16} />
          <span>Plataforma financiera segura y cifrada</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-tight">
          El ecosistema definitivo para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Patrimonio Total</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
          FinanzasDMS no es solo una hoja de cálculo. Es tu centro de mando para gestionar préstamos, portafolios de inversión, tarjetas de crédito y trading de criptomonedas en un solo lugar.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            to="/register" 
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20"
          >
            Comenzar ahora <ArrowRight size={20} />
          </Link>
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-slate-700 shadow-xl"
          >
            Acceder a mi cuenta
          </Link>
        </div>
      </main>

      {/* --- CARACTERÍSTICAS (Opcional, para darle volumen) --- */}
      <section className="container mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
              <PieChart className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Portafolios e Inversiones</h3>
            <p className="text-slate-400 leading-relaxed">Sigue el rendimiento de tus CETES, SOFIPOS, Acciones y Fibras. Calcula tus ganancias reales descontando inflación y comisiones.</p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-colors">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <Wallet className="text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Gestión de Préstamos</h3>
            <p className="text-slate-400 leading-relaxed">Controla las líneas de crédito que otorgas. Revisa el estatus de las amortizaciones, pagos atrasados y automatiza tus cobros.</p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
              <Bitcoin className="text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Terminal Cripto Inteligente</h3>
            <p className="text-slate-400 leading-relaxed">Conexión directa al mercado para trackear tus compras en Spot. Controla tu liquidez en USDT y calcula tu PnL (Ganancias/Pérdidas) en segundos.</p>
          </div>

        </div>
      </section>

    </div>
  );
}