import { Link } from 'react-router-dom';
import { ArrowRight, HandCoins } from 'lucide-react';

// [INVESTOR, ADMIN] En Gana Dinero: el panel vive en la sección Inversionista del menú
export default function InvestorAreaLink({ investorAlias }: { investorAlias: string | null }) {
  return (
    <section className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 self-start shrink-0">
        <HandCoins size={24} className="text-brand-green-light" />
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-text-primary text-lg">Ya eres inversionista</h2>
        <p className="text-text-secondary text-sm mt-1">
          {investorAlias && <><strong className="text-text-primary">@{investorAlias}</strong> · </>}
          Tu panel, las solicitudes de préstamo y tu perfil están en la sección <strong className="text-text-primary">Inversionista</strong> del menú.
        </p>
      </div>
      <Link
        to="/investor/wallet"
        className="bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-brand-green/20 w-full sm:w-auto inline-flex items-center justify-center gap-2"
      >
        Ir a mi panel <ArrowRight size={16} />
      </Link>
    </section>
  );
}
