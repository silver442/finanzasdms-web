import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Coins, Gift, Info, TrendingUp } from 'lucide-react';
import InvestorSection from '../../components/investor/InvestorSection';
import ReferralCardView from '../../components/referrals/ReferralCardView';
import CategoryTabs from '../../components/referrals/CategoryTabs';
import HowItWorksModal from '../../components/referrals/HowItWorksModal';
import {
  API, CATEGORY_META, authHeaders, type ReferralCard, type ReferralCategory,
} from '../../components/referrals/referralTypes';

export default function Investments() {
  const [cards, setCards] = useState<ReferralCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<ReferralCategory | 'ALL'>('ALL');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get<ReferralCard[]>(`${API}/referral-cards`, { headers: authHeaders() });
      setCards(data);
    } catch {
      toast.error('No se pudieron cargar las promociones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con la API al montar
  useEffect(() => { void fetchCards(); }, [fetchCards]);

  const visible = useMemo(
    () => (category === 'ALL' ? cards : cards.filter((c) => c.category === category)),
    [cards, category],
  );

  // En escritorio van 3 por fila; si la última fila queda con 2, cada una ocupa media fila
  const lastRowStart = visible.length % 3 === 2 ? visible.length - 2 : visible.length;

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary flex items-center gap-3">
          <TrendingUp size={32} className="text-brand-green-light" />
          Gana Dinero
        </h1>
        <p className="text-text-secondary mt-1">
          Descubre beneficios, recompensas y oportunidades financieras para hacer crecer tu patrimonio.
        </p>
      </div>

      {/* Crowdlending: solicitud para ser inversionista o acceso a su sección */}
      <InvestorSection />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-green/20 via-surface-card/70 to-brand-green/10 border border-brand-green/30 rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 shadow-card">
        <div className="relative w-20 h-14 shrink-0 hidden sm:block" aria-hidden>
          <Gift size={48} strokeWidth={1.5} className="absolute left-0 top-0 text-brand-green-light" />
          <Coins size={32} strokeWidth={1.5} className="absolute right-0 bottom-0 text-amber-400" />
        </div>
        <div className="hidden md:block w-px self-stretch bg-white/10" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-text-primary">Tu dinero, más oportunidades</h2>
          <p className="text-text-secondary text-sm mt-0.5 max-w-xl">
            Explora promociones, bonos de bienvenida y beneficios de distintas plataformas financieras desde Cashi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHowItWorks(true)}
          className="shrink-0 inline-flex items-center justify-center gap-2 border border-brand-green-light/60 hover:bg-brand-green/15 text-text-primary font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          <Info size={18} /> ¿Cómo funciona? <ArrowRight size={16} />
        </button>
      </section>

      {/* Promociones */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-text-primary">Promociones y recompensas</h2>
        <CategoryTabs value={category} onChange={setCategory} />

        {isLoading ? (
          <div className="flex justify-center py-20 text-text-secondary">Cargando promociones...</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-text-muted bg-surface-card/40 border border-white/5 rounded-2xl">
            <Gift size={44} className="mx-auto mb-3 opacity-30" />
            <p>
              {category === 'ALL'
                ? 'Aún no hay promociones publicadas.'
                : `Aún no hay promociones de ${CATEGORY_META[category].plural}.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            {visible.map((card, i) => {
              const wide = i >= lastRowStart;
              return (
                <div key={card.id} className={wide ? 'xl:col-span-3' : 'xl:col-span-2'}>
                  <ReferralCardView card={card} wide={wide} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Aviso legal */}
      <footer className="flex gap-3 items-start bg-surface-card/60 border border-white/5 rounded-2xl px-5 py-3 text-sm text-text-secondary">
        <Info size={20} className="shrink-0 mt-0.5" />
        <p>
          Algunos enlaces contienen códigos de referido por los que Cashi puede recibir una comisión. Las promociones están
          sujetas a los términos y condiciones de cada institución. Las inversiones implican riesgos y no garantizan rendimientos.
        </p>
      </footer>

      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
    </div>
  );
}
