import { useState } from 'react';
import { Link } from 'react-router-dom';

interface CreditCard {
  id: string;
  name: string;
  cutDate: string;
  limitDate: string;
  debt: number;
  isPaid: boolean;
}

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([
    { id: '1', name: 'Santander Amex', cutDate: '10 de cada mes', limitDate: '30 de cada mes', debt: 0, isPaid: true },
    { id: '2', name: 'Santander LikeU', cutDate: '10 de cada mes', limitDate: '04 de cada mes', debt: 0, isPaid: true },
    { id: '3', name: 'Santander Samsung', cutDate: '16 de cada mes', limitDate: '07 de cada mes', debt: 29179.60, isPaid: false },
    { id: '4', name: 'Mercado Pago', cutDate: '26 de cada mes', limitDate: '07 de cada mes', debt: 5944.01, isPaid: false },
    { id: '5', name: 'YoTePresto', cutDate: '-', limitDate: '04 de cada mes', debt: 6785.00, isPaid: false },
  ]);

  // Estados para el Modal de Nueva Tarjeta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({ name: '', cutDate: '', limitDate: '', debt: '' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const totalDebt = cards.reduce((acc, card) => acc + card.debt, 0);

  const togglePaidStatus = (id: string) => {
    setCards(cards.map(card => 
      card.id === id ? { ...card, isPaid: !card.isPaid } : card
    ));
  };

  // Función para guardar la nueva tarjeta
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cardToAdd: CreditCard = {
      id: Date.now().toString(),
      name: newCard.name,
      cutDate: newCard.cutDate,
      limitDate: newCard.limitDate,
      debt: parseFloat(newCard.debt) || 0,
      isPaid: false
    };

    setCards([...cards, cardToAdd]);
    setIsModalOpen(false);
    setNewCard({ name: '', cutDate: '', limitDate: '', debt: '' });
  };

  return (
    <div className="p-8 text-white font-sans max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400">Tarjetas de Crédito</h1>
          <p className="text-slate-400 mt-2">Control manual de cortes y pagos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20"
        >
          + Nuevo Crédito
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-300 text-sm uppercase tracking-wider border-b border-slate-700">
                <th className="p-4 font-semibold">Tarjeta / Crédito</th>
                <th className="p-4 font-semibold">Día de Corte</th>
                <th className="p-4 font-semibold">Fecha Límite</th>
                <th className="p-4 font-semibold text-right">Deuda</th>
                <th className="p-4 font-semibold text-center">Pagado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-medium">
                    <Link 
                      to={`/credit-cards/${card.id}`} 
                      className="text-emerald-400 hover:text-emerald-300 hover:underline transition-all"
                    >
                      {card.name}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-400">{card.cutDate}</td>
                  <td className="p-4 text-slate-400">{card.limitDate}</td>
                  <td className={`p-4 text-right font-bold ${card.debt > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {formatCurrency(card.debt)}
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={card.isPaid}
                      onChange={() => togglePaidStatus(card.id)}
                      className="w-5 h-5 accent-emerald-500 cursor-pointer rounded bg-slate-900 border-slate-600 focus:ring-emerald-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/80 border-t border-slate-600">
                <td colSpan={3} className="p-4 text-right font-bold text-slate-300 uppercase tracking-wider">
                  Total a pagar:
                </td>
                <td className="p-4 text-right font-extrabold text-red-500 text-xl">
                  {formatCurrency(totalDebt)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE NUEVA TARJETA                     */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Registrar Nueva Tarjeta</h2>
            
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Nombre (Ej. Nu, Hey Banco)</label>
                <input 
                  type="text" 
                  required
                  value={newCard.name}
                  onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Día de Corte</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 10 de cada mes"
                    required
                    value={newCard.cutDate}
                    onChange={(e) => setNewCard({...newCard, cutDate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Fecha Límite</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 04 de mayo"
                    required
                    value={newCard.limitDate}
                    onChange={(e) => setNewCard({...newCard, limitDate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Deuda Inicial (Opcional)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={newCard.debt}
                  onChange={(e) => setNewCard({...newCard, debt: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-bold"
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