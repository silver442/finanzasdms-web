import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';

// [INVESTOR, ADMIN] En Gana Dinero: el panel vive en la sección Inversionista del menú
export default function InvestorAreaLink({ investorAlias }: { investorAlias: string | null }) {
  return (
    <section className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-2.5 self-start sm:self-center shrink-0">
        <Users size={22} className="text-brand-green-light" />
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-text-primary">
          Ya eres inversionista
          {investorAlias && <span className="text-text-secondary font-semibold"> · @{investorAlias}</span>}
        </h2>
        <p className="text-text-secondary text-sm">
          Accede a tu panel de inversionista, revisa tus solicitudes de préstamo y tu perfil.
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
