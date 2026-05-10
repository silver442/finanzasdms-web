import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
// Importamos los iconos de Lucide
import { Plus, CreditCard, Calendar, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreditCardItem {
  id: string;
  name: string;
  cutDate: string;
  limitDate: string;
  debt: number;
  isPaid: boolean;
}

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCardItem[]>([
    { id: '1', name: 'Santander Amex', cutDate: '10 de cada mes', limitDate: '30 de cada mes', debt: 0, isPaid: true },
    { id: '2', name: 'Santander LikeU', cutDate: '10 de cada mes', limitDate: '04 de cada mes', debt: 0, isPaid: true },
    { id: '3', name: 'Santander Samsung', cutDate: '16 de cada mes', limitDate: '07 de cada mes', debt: 29179.60, isPaid: false },
    { id: '4', name: 'Mercado Pago', cutDate: '26 de cada mes', limitDate: '07 de cada mes', debt: 5944.01, isPaid: false },
    { id: '5', name: 'YoTePresto', cutDate: '-', limitDate: '04 de cada mes', debt: 6785.00, isPaid: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardStatus, setCardStatus] = useState<'new' | 'existing'>('new');
  const [newCard, setNewCard] = useState({ name: '', cutDate: '', limitDate: '', debt: '' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const totalDebt = cards.reduce((acc, card) => acc + card.debt, 0);

  const togglePaidStatus = (id: string) => {
    setCards(cards.map(card => {
      if (card.id === id) {
        const newStatus = !card.isPaid;
        if (newStatus) toast.success(`¡${card.name} marcada como pagada!`);
        return { ...card, isPaid: newStatus };
      }
      return card;
    }));
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cardToAdd: CreditCardItem = {
      id: Date.now().toString(),
      name: newCard.name,
      cutDate: newCard.cutDate,
      limitDate: newCard.limitDate,
      debt: cardStatus === 'existing' ? (parseFloat(newCard.debt) || 0) : 0,
      isPaid: cardStatus === 'new' // Si es nueva, se asume pagada (en ceros)
    };

    setCards([...cards, cardToAdd]);
    setIsModalOpen(false);
    setNewCard({ name: '', cutDate: '', limitDate: '', debt: '' });
    setCardStatus('new');
    
    // Notificación de éxito
    toast.success(`${cardToAdd.name} agregada al panel de créditos`);
  };

  return (
    <div className="p-8 text-white font-sans max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <CreditCard size={32} />
            Tarjetas de Crédito
          </h1>
          <p className="text-slate-400 mt-2">Control manual de cortes y pagos pendientes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Crédito
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-300 text-sm uppercase tracking-wider border-b border-slate-700">
                <th className="p-4 font-semibold">Tarjeta / Crédito</th>
                <th className="p-4 font-semibold flex items-center gap-2"><Calendar size={16}/> Día de Corte</th>
                <th className="p-4 font-semibold">Fecha Límite</th>
                <th className="p-4 font-semibold text-right">Deuda</th>
                <th className="p-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="p-4 font-medium">
                    <Link 
                      to={`/credit-cards/${card.id}`} 
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-all"
                    >
                      <CreditCard size={18} className="text-slate-500 group-hover:text-emerald-400" />
                      {card.name}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-400 font-medium">{card.cutDate}</td>
                  <td className="p-4 text-slate-400 font-medium">{card.limitDate}</td>
                  <td className={`p-4 text-right font-bold text-lg ${card.debt > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {formatCurrency(card.debt)}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => togglePaidStatus(card.id)}
                      className={`p-2 rounded-lg transition-all ${card.isPaid ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 hover:text-red-400'}`}
                    >
                      {card.isPaid ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/80 border-t border-slate-600">
                <td colSpan={3} className="p-6 text-right font-bold text-slate-300 uppercase tracking-wider">
                  Total a pagar:
                </td>
                <td className="p-6 text-right font-black text-red-500 text-2xl">
                  {formatCurrency(totalDebt)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL INTELIGENTE CON ICONOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-emerald-500" /> Registrar Crédito
            </h2>
            
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCardStatus('new')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${cardStatus === 'new' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Tarjeta Nueva
                </button>
                <button
                  type="button"
                  onClick={() => setCardStatus('existing')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${cardStatus === 'existing' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Con Deuda Actual
                </button>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <CreditCard size={14} /> Nombre de la Tarjeta
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Nu, Hey Banco"
                  value={newCard.name}
                  onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Día de Corte</label>
                  <input 
                    type="text" 
                    placeholder="10 de cada mes"
                    required
                    value={newCard.cutDate}
                    onChange={(e) => setNewCard({...newCard, cutDate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Fecha Límite</label>
                  <input 
                    type="text" 
                    placeholder="04 de mayo"
                    required
                    value={newCard.limitDate}
                    onChange={(e) => setNewCard({...newCard, limitDate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {cardStatus === 'existing' && (
                <div className="pt-2">
                  <label className="block text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <DollarSign size={14} /> Saldo deudor actual
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={newCard.debt}
                    onChange={(e) => setNewCard({...newCard, debt: e.target.value})}
                    className="w-full bg-slate-900 border border-emerald-500/30 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/20"
                >
                  Guardar Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}