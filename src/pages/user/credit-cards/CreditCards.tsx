import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, CreditCard, Calendar, CalendarDays, Search, CircleCheck, Clock,
  ChartColumn, Trash2, RefreshCw, Pencil, SquareCheck, Square, CircleDot,
} from 'lucide-react';
import BankLogo from '../../../components/credit-cards/BankLogo';
import CreditCardVisual from '../../../components/credit-cards/CreditCardVisual';
import PaymentProgressRing from '../../../components/credit-cards/PaymentProgressRing';
import CardFormModal from './CardFormModal';
import { fmt, fmtDayMonth, type CreditCardItem } from '../../../utils/creditCards';

type StatusTab = 'ALL' | 'PENDING' | 'PAID';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // undefined = cerrado, null = registrar, tarjeta = editar
  const [formCard, setFormCard] = useState<CreditCardItem | null | undefined>(undefined);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [tab, setTab] = useState<StatusTab>('ALL');
  const [search, setSearch] = useState('');

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get<CreditCardItem[]>(`${API}/credit-cards`, { headers: authHeaders() });
      setCards(data);
    } catch {
      toast.error('No se pudieron cargar las tarjetas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCards(); }, [fetchCards]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la tarjeta "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/credit-cards/${id}`, { headers: authHeaders() });
      toast.success(`${name} eliminada`);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Error al eliminar la tarjeta');
    } finally {
      setDeletingId(null);
    }
  };

  const paidCount = cards.filter(c => c.statement.isPaid).length;
  const pendingCount = cards.length - paidCount;
  const totalToPay = cards.reduce((acc, c) => acc + c.statement.debt, 0);
  const progressPct = cards.length > 0 ? Math.round((paidCount / cards.length) * 100) : 0;

  const visibleCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards
      .filter(c => tab === 'ALL' || (tab === 'PAID' ? c.statement.isPaid : !c.statement.isPaid))
      .filter(c => !term || c.name.toLowerCase().includes(term));
  }, [cards, tab, search]);

  const upcomingCutoffs = useMemo(
    () => [...cards]
      .sort((a, b) => new Date(a.nextCutoffDate).getTime() - new Date(b.nextCutoffDate).getTime())
      .slice(0, 3),
    [cards],
  );

  const panelCls = 'bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card';

  const tabs: { key: StatusTab; label: string; count: number; icon?: typeof Clock }[] = [
    { key: 'ALL', label: 'Todas', count: cards.length },
    { key: 'PENDING', label: 'Pendientes', count: pendingCount, icon: Clock },
    { key: 'PAID', label: 'Pagadas', count: paidCount, icon: CircleCheck },
  ];

  const rowActions = (card: CreditCardItem) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => setFormCard(card)}
        className="p-1.5 rounded-lg text-text-muted hover:text-sky-400 hover:bg-sky-500/10 transition-all"
        title="Editar tarjeta"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={() => void handleDelete(card.id, card.name)}
        disabled={deletingId === card.id}
        className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
        title="Eliminar tarjeta"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  const debtBadge = (debt: number) => debt > 0
    ? <span className="inline-block bg-rose-500/20 text-rose-400 font-bold text-sm px-2.5 py-1 rounded-lg">{fmt(debt)}</span>
    : <span className="font-semibold text-sm text-text-primary">{fmt(0)}</span>;

  const paidMark = (isPaid: boolean) => isPaid
    ? <SquareCheck size={22} className="text-emerald-400" aria-label="Pagado" />
    : <Square size={22} className="text-text-muted" aria-label="Pendiente" />;

  const metrics = [
    { icon: CreditCard, label: 'Tarjetas registradas', value: String(cards.length) },
    { icon: CalendarDays, label: 'Total a pagar', value: fmt(totalToPay) },
    { icon: CircleCheck, label: 'Tarjetas pagadas', value: `${paidCount} / ${cards.length}`, accent: true },
  ];

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-brand-green/10 border border-brand-green/20 items-center justify-center">
            <CreditCard size={28} className="text-brand-green-light" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Tarjetas de Crédito</h1>
            <p className="text-text-secondary mt-1">Seguimiento de cortes, límites y pagos de tus tarjetas.</p>
          </div>
        </div>
        <button
          onClick={() => setFormCard(null)}
          className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus size={20} />
          Nueva Tarjeta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando tarjetas...
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-text-muted bg-surface-card/50 rounded-2xl border border-surface-border">
          <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold text-text-secondary">Sin tarjetas registradas</p>
          <p className="text-sm mt-1">Agrega tu primera tarjeta de crédito para comenzar el seguimiento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-6">
          <div className="space-y-6 min-w-0">

            {/* Métricas */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
              {metrics.map(({ icon: Icon, label, value, accent }) => (
                <div key={label} className={`${panelCls} p-4 flex items-center gap-3`}>
                  <div className="hidden sm:flex w-11 h-11 rounded-full bg-brand-green/10 items-center justify-center shrink-0">
                    <Icon size={20} className="text-brand-green-light" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-text-secondary truncate">{label}</p>
                    <p className={`text-lg md:text-2xl font-extrabold truncate ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
                  </div>
                </div>
              ))}
              <div className={`${panelCls} p-4 flex items-center gap-3`}>
                <div className="hidden sm:flex w-11 h-11 rounded-full bg-brand-green/10 items-center justify-center shrink-0">
                  <ChartColumn size={20} className="text-brand-green-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary truncate">Avance de pagos</p>
                  <p className="text-lg md:text-2xl font-extrabold text-white">{progressPct}%</p>
                  <div className="h-1.5 mt-1 bg-surface-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className={`${panelCls} p-3 md:p-4`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex bg-surface-base/60 rounded-xl p-1 border border-white/5 overflow-x-auto">
                  {tabs.map(({ key, label, count, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                        tab === key ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      {Icon && <Icon size={15} />}
                      {label} ({count})
                    </button>
                  ))}
                </div>
                <div className="relative md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar tarjeta..."
                    className="w-full bg-surface-base/60 border border-white/5 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted"
                  />
                </div>
              </div>

              {visibleCards.length === 0 ? (
                <p className="text-center text-text-muted py-10 text-sm">No hay tarjetas que coincidan.</p>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-text-secondary text-xs uppercase tracking-wider">
                          <th className="px-3 py-3 font-semibold">Fecha de inicio</th>
                          <th className="px-3 py-3 font-semibold">Fecha de corte</th>
                          <th className="px-3 py-3 font-semibold">Tarjeta de crédito</th>
                          <th className="px-3 py-3 font-semibold">Fecha límite de pago</th>
                          <th className="px-3 py-3 font-semibold text-right">Deuda</th>
                          <th className="px-3 py-3 font-semibold text-center">Pagado</th>
                          <th className="px-1 py-3 w-16" />
                        </tr>
                      </thead>
                      <tbody>
                        {visibleCards.map(card => (
                          <tr key={card.id} className="odd:bg-surface-base/40 hover:bg-surface-elevated/40 transition-colors group">
                            <td className="px-3 py-2.5 text-sm text-text-primary whitespace-nowrap">{fmtDayMonth(card.statement.periodStart)}</td>
                            <td className="px-3 py-2.5 text-sm text-text-primary whitespace-nowrap">{fmtDayMonth(card.statement.cutoffDate)}</td>
                            <td className="px-3 py-2.5">
                              <Link to={`/credit-cards/${card.id}`} className="flex items-center gap-3 text-sm font-medium text-white hover:text-brand-green-light transition-colors">
                                <BankLogo key={card.bank ?? card.name} name={card.name} bank={card.bank} color={card.color} size="sm" />
                                <span className="truncate max-w-48">{card.name}</span>
                              </Link>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-text-primary whitespace-nowrap">{fmtDayMonth(card.statement.dueDate)}</td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">{debtBadge(card.statement.debt)}</td>
                            <td className="px-3 py-2.5"><div className="flex justify-center">{paidMark(card.statement.isPaid)}</div></td>
                            <td className="px-1 py-2.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">{rowActions(card)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Móvil */}
                  <ul className="md:hidden space-y-2">
                    {visibleCards.map(card => (
                      <li key={card.id} className="bg-surface-base/40 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Link to={`/credit-cards/${card.id}`} className="flex items-center gap-3 min-w-0 text-sm font-semibold text-white">
                            <BankLogo key={card.bank ?? card.name} name={card.name} bank={card.bank} color={card.color} size="sm" />
                            <span className="truncate">{card.name}</span>
                          </Link>
                          {paidMark(card.statement.isPaid)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div><p className="text-text-muted">Inicio</p><p className="text-text-primary">{fmtDayMonth(card.statement.periodStart)}</p></div>
                          <div><p className="text-text-muted">Corte</p><p className="text-text-primary">{fmtDayMonth(card.statement.cutoffDate)}</p></div>
                          <div><p className="text-text-muted">Límite de pago</p><p className="text-text-primary">{fmtDayMonth(card.statement.dueDate)}</p></div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {debtBadge(card.statement.debt)}
                          {rowActions(card)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="flex items-center justify-end gap-4 mt-4 bg-surface-base/40 rounded-xl px-4 py-3">
                <span className="font-bold text-text-primary">Total a pagar:</span>
                <span className={`font-extrabold text-lg px-3 py-1 rounded-lg ${totalToPay > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                  {fmt(totalToPay)}
                </span>
              </div>
            </div>
          </div>

          {/* Panel de resumen */}
          <aside className="space-y-6">
            <div className={`${panelCls} p-5 relative overflow-hidden`}>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-56 bg-brand-green-dark/[6%] rounded-full blur-3xl pointer-events-none" />
              <CreditCardVisual stacked className="max-w-64 mx-auto" />
              <div className="mt-4 border-l-4 border-emerald-400 pl-4">
                <p className="text-text-secondary">Total a pagar</p>
                <p className="text-3xl xl:text-4xl font-extrabold text-white">{fmt(totalToPay)}</p>
              </div>
            </div>

            <div className={`${panelCls} p-5`}>
              <h2 className="flex items-center gap-2 font-bold text-white mb-4">
                <CircleDot size={18} className="text-brand-green-light" /> Avance de pagos
              </h2>
              <PaymentProgressRing paid={paidCount} total={cards.length} />
            </div>

            <div className={`${panelCls} p-5`}>
              <h2 className="flex items-center gap-2 font-bold text-white mb-3">
                <CalendarDays size={18} className="text-brand-green-light" /> Próximos cortes
              </h2>
              <ul className="space-y-2">
                {upcomingCutoffs.map(card => (
                  <li key={card.id}>
                    <Link to={`/credit-cards/${card.id}`} className="flex items-center justify-between gap-3 bg-surface-base/40 hover:bg-surface-elevated/40 rounded-xl px-3 py-2.5 transition-colors">
                      <span className="flex items-center gap-2 text-sm text-text-primary whitespace-nowrap">
                        <Calendar size={15} className="text-text-muted" /> {fmtDayMonth(card.nextCutoffDate)}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-white min-w-0">
                        <BankLogo key={card.bank ?? card.name} name={card.name} bank={card.bank} color={card.color} size="sm" />
                        <span className="truncate">{card.name}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
      {formCard !== undefined && (
        <CardFormModal
          card={formCard}
          onClose={() => setFormCard(undefined)}
          onSaved={() => { setFormCard(undefined); void fetchCards(); }}
        />
      )}
    </div>
  );
}
