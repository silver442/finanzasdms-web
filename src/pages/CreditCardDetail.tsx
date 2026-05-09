import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreditCardDetail() {
  //const { id } = useParams();
  const navigate = useNavigate();

  // 1. Controles para abrir/cerrar el modal y guardar lo que escribes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ date: '', description: '', amount: '' });

  // MOCK DATA: Información general estática
  const cardInfo = {
    name: 'Santander LikeU',
    creditLine: 5200,
    startDate: '10 marzo',
    cutDate: '10 abril',
    paymentDate: '04 de mayo',
    totalDebt: 1364.64, 
    availableBalance: 3835.36
  };

  const msiPurchases = [
    { id: 1, date: '25/01/26', product: 'amazon', total: 713, months: 3, monthlyPayment: 237.64 },
    { id: 2, date: '25/01/26', product: 'amazon', total: 249, months: 3, monthlyPayment: 83.00 },
  ];

  // 2. Convertimos los gastos en un Estado para poder agregar nuevos
  const [currentPeriod, setCurrentPeriod] = useState([
    { id: 1, date: '15/01/26', amount: 302, description: 'agua' },
    { id: 2, date: '15/01/26', amount: 236, description: 'gas' },
    { id: 3, date: '12/02/26', amount: 237.64, description: 'amazon' },
    { id: 4, date: '12/02/26', amount: 83, description: 'amazon' },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // 3. Función que se ejecuta al darle "Guardar" en el Modal
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Creamos el nuevo objeto de gasto
    const expenseToAdd = {
      id: Date.now(), // Generamos un ID temporal
      date: newExpense.date,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount)
    };

    // Actualizamos la tabla, sumando el nuevo gasto a los que ya existían
    setCurrentPeriod([...currentPeriod, expenseToAdd]);
    
    // Cerramos el modal y limpiamos el formulario
    setIsModalOpen(false);
    setNewExpense({ date: '', description: '', amount: '' });
  };

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto relative">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/credit-cards')}
          className="text-slate-400 hover:text-emerald-400 transition-colors bg-slate-800 p-2 rounded-lg"
        >
          ← Regresar
        </button>
        <h1 className="text-3xl font-extrabold text-emerald-400">Detalle: {cardInfo.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: Resumen */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 h-fit shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Información General</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Línea de Crédito</span> <span className="font-bold">{formatCurrency(cardInfo.creditLine)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Fecha de Inicio</span> <span className="font-medium text-slate-300">{cardInfo.startDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Fecha de Corte</span> <span className="font-medium text-slate-300">{cardInfo.cutDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Fecha de Pago</span> <span className="font-medium text-emerald-400">{cardInfo.paymentDate}</span></div>
            <div className="pt-3 border-t border-slate-700 flex justify-between"><span className="text-slate-400">Deuda Total</span> <span className="font-bold text-red-400">{formatCurrency(cardInfo.totalDebt)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Saldo Disponible</span> <span className="font-bold text-emerald-400">{formatCurrency(cardInfo.availableBalance)}</span></div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Tablas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabla MSI (Sin cambios) */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Productos a Crédito (MSI)</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 bg-slate-800/50">
                <tr>
                  <th className="p-3 font-semibold">Fecha</th>
                  <th className="p-3 font-semibold">Producto</th>
                  <th className="p-3 font-semibold text-center">Meses</th>
                  <th className="p-3 font-semibold text-right">Pago Mensual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {msiPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-700/30">
                    <td className="p-3 text-slate-300">{p.date}</td>
                    <td className="p-3 text-white">{p.product}</td>
                    <td className="p-3 text-center text-slate-300">{p.months}</td>
                    <td className="p-3 text-right font-medium text-red-400">{formatCurrency(p.monthlyPayment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tabla Periodo Actual */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Movimientos Periodo Actual</h2>
              {/* AL DAR CLIC, ABRIMOS EL MODAL */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-white rounded font-bold transition-colors cursor-pointer"
              >
                + Agregar Gasto
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 bg-slate-800/50">
                <tr>
                  <th className="p-3 font-semibold">Fecha</th>
                  <th className="p-3 font-semibold">Descripción</th>
                  <th className="p-3 font-semibold text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {currentPeriod.map(m => (
                  <tr key={m.id} className="hover:bg-slate-700/30">
                    <td className="p-3 text-slate-300">{m.date}</td>
                    <td className="p-3 text-white capitalize">{m.description}</td>
                    <td className="p-3 text-right font-medium text-red-400">{formatCurrency(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE AGREGAR GASTO (Capa Flotante)       */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Registrar Nuevo Gasto</h2>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Fecha</label>
                <input 
                  type="date" 
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Descripción</label>
                <input 
                  type="text" 
                  placeholder="Ej. Despensa, Gasolina..."
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Cantidad (MXN)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
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
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}