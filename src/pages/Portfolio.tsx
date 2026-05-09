import { useState } from 'react';

interface PortfolioItem {
  id: string;
  investmentType: string;
  category: string;
  accountName: string;
  deposited: number;
  realValue: number;
}

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([
    { id: '1', investmentType: 'Efectivo', category: 'Cuentas corriente', accountName: 'Santander / Bancoppel', deposited: 5456.19, realValue: 5456.19 },
    { id: '2', investmentType: 'Fondo de emergencia', category: 'Cetes', accountName: 'CetesDirecto', deposited: 8.15, realValue: 8.11 },
    { id: '3', investmentType: 'Renta fija', category: 'Sofipo', accountName: 'Nu', deposited: 4977.09, realValue: 5911.95 },
    { id: '4', investmentType: 'Renta fija', category: 'Fintec', accountName: 'Yotepresto', deposited: 6000.00, realValue: 6071.00 },
    { id: '5', investmentType: 'Renta Variable', category: 'Acciones', accountName: 'GBM+', deposited: 21200.00, realValue: 1280.92 },
    { id: '6', investmentType: 'Renta Variable', category: 'Criptomonedas', accountName: 'Bitget', deposited: 80000.00, realValue: 87500.00 },
  ]);

  const predefinedCategories = ['Efectivo', 'Fondo de emergencia', 'Sofipo', 'Fintec', 'Acciones', 'ETFs', 'Fibras', 'Criptomonedas', 'Otro...'];

  const [selectedAccount, setSelectedAccount] = useState<PortfolioItem | null>(null);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isNewWeekModalOpen, setIsNewWeekModalOpen] = useState(false);

  const [accountStatus, setAccountStatus] = useState<'new' | 'existing'>('new');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newAccount, setNewAccount] = useState({ 
    investmentType: 'Renta fija', 
    category: 'Sofipo', 
    customCategory: '', 
    accountName: '', 
    deposited: '', 
    realValue: '' 
  });

  // NUEVO ESTADO PARA EL MOVIMIENTO INTELIGENTE
  const [newMovement, setNewMovement] = useState({ 
    date: '', 
    type: 'Depósito', // Puede ser 'Depósito', 'Retiro', o 'Gasto'
    amount: '' 
  });

  const [weeklyHistory, setWeeklyHistory] = useState([
    { id: 1, weekStart: '30/03/26', weekEnd: '05/04/26', amount: 4120.47 },
    { id: 2, weekStart: '23/03/26', weekEnd: '29/03/26', amount: 4879.54 },
    { id: 3, weekStart: '16/03/26', weekEnd: '22/03/26', amount: 0.00 },
    { id: 4, weekStart: '09/03/26', weekEnd: '15/03/26', amount: 1000.00 },
    { id: 5, weekStart: '02/03/26', weekEnd: '08/03/26', amount: -1000.00 },
  ]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  const formatPercent = (percent: number) => new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2 }).format(percent);

  const totalDeposited = items.reduce((acc, item) => acc + item.deposited, 0);
  const totalRealValue = items.reduce((acc, item) => acc + item.realValue, 0);
  const totalGain = totalRealValue - totalDeposited;
  const totalYield = totalDeposited > 0 ? (totalGain / totalDeposited) : 0;

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Efectivo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Fondo de emergencia': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Renta fija': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Renta Variable': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Otro...') {
      setIsCustomCategory(true);
      setNewAccount({ ...newAccount, category: 'Otro...' });
    } else {
      setIsCustomCategory(false);
      setNewAccount({ ...newAccount, category: value, customCategory: '' });
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? newAccount.customCategory : newAccount.category;
    const finalDeposited = accountStatus === 'existing' ? (parseFloat(newAccount.deposited) || 0) : 0;
    const finalRealValue = accountStatus === 'existing' ? (parseFloat(newAccount.realValue) || 0) : 0;

    const accountToAdd: PortfolioItem = {
      id: Date.now().toString(),
      investmentType: newAccount.investmentType,
      category: finalCategory,
      accountName: newAccount.accountName,
      deposited: finalDeposited,
      realValue: finalRealValue,
    };
    
    setItems([...items, accountToAdd]);
    setIsNewAccountModalOpen(false);
    setNewAccount({ investmentType: 'Renta fija', category: 'Sofipo', customCategory: '', accountName: '', deposited: '', realValue: '' });
    setIsCustomCategory(false);
    setAccountStatus('new');
  };

  // FUNCIÓN MATEMÁTICA PARA CALCULAR LA SEMANA (Lunes a Domingo)
  const getWeekRange = (dateString: string) => {
    if (!dateString) return null;
    
    // Separamos la fecha para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const dayOfWeek = d.getDay(); // 0 es Domingo, 1 es Lunes...
    // Si es domingo (0), restamos 6 días para llegar al lunes. Si no, restamos el día actual menos 1.
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yy = String(date.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    };

    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const weekRange = getWeekRange(newMovement.date);
    if (!weekRange) return;

    const [start, end] = weekRange.split(' - ');
    
    // Forzamos el importe a ser número positivo inicial
    let rawAmount = Math.abs(parseFloat(newMovement.amount) || 0);
    
    // Si es Retiro o Gasto, lo hacemos negativo automáticamente
    if (newMovement.type === 'Retiro' || newMovement.type === 'Gasto') {
      rawAmount = -rawAmount;
    }

    const weekToAdd = {
      id: Date.now(),
      weekStart: start,
      weekEnd: end,
      amount: rawAmount,
    };

    setWeeklyHistory([weekToAdd, ...weeklyHistory]);
    setIsNewWeekModalOpen(false);
    setNewMovement({ date: '', type: 'Depósito', amount: '' });
  };

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400">Portafolio de Inversiones</h1>
          <p className="text-slate-400 mt-2">Resumen global y valor real</p>
        </div>
        <button 
          onClick={() => setIsNewAccountModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
        >
          + Nueva Cuenta
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            {/* Cabecera y cuerpo de la tabla se mantienen igual */}
            <thead>
              <tr className="bg-slate-900/80 text-slate-300 uppercase tracking-wider border-b border-slate-700">
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Categoría</th>
                <th className="p-4 font-semibold">Cuenta</th>
                <th className="p-4 font-semibold text-right">Depositado</th>
                <th className="p-4 font-semibold text-right">Valor Real</th>
                <th className="p-4 font-semibold text-right">Ganancia</th>
                <th className="p-4 font-semibold text-right">Rendimiento</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.map((item) => {
                const gain = item.realValue - item.deposited;
                const yieldPercent = item.deposited > 0 ? (gain / item.deposited) : 0;
                const isPositive = gain >= 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(item.investmentType)}`}>
                        {item.investmentType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{item.category}</td>
                    <td className="p-4 font-bold text-white">{item.accountName}</td>
                    <td className="p-4 text-right text-slate-300">{formatCurrency(item.deposited)}</td>
                    <td className="p-4 text-right font-bold text-white">{formatCurrency(item.realValue)}</td>
                    <td className={`p-4 text-right font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(gain)}
                    </td>
                    <td className={`p-4 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{formatPercent(yieldPercent)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedAccount(item)}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline text-xs font-bold px-3 py-1 bg-emerald-500/10 rounded-lg transition-colors"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/90 border-t-2 border-slate-600">
                <td colSpan={3} className="p-4 text-right font-bold text-slate-300 uppercase tracking-wider">Totales:</td>
                <td className="p-4 text-right font-bold text-slate-300">{formatCurrency(totalDeposited)}</td>
                <td className="p-4 text-right font-extrabold text-white text-lg">{formatCurrency(totalRealValue)}</td>
                <td className={`p-4 text-right font-extrabold text-lg ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
                </td>
                <td className={`p-4 text-right font-black text-xl ${totalYield >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {totalYield >= 0 ? '+' : ''}{formatPercent(totalYield)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 1. MODAL INTELIGENTE DE NUEVA CUENTA (Sin cambios visuales respecto a la vez anterior) */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Agregar Nueva Cuenta</h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setAccountStatus('new')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${accountStatus === 'new' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Cuenta Nueva (En ceros)
                </button>
                <button
                  type="button"
                  onClick={() => setAccountStatus('existing')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${accountStatus === 'existing' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Ya tengo saldo
                </button>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Tipo de Inversión</label>
                <select 
                  value={newAccount.investmentType}
                  onChange={(e) => setNewAccount({...newAccount, investmentType: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Fondo de emergencia">Fondo de emergencia</option>
                  <option value="Renta fija">Renta fija</option>
                  <option value="Renta Variable">Renta Variable</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Categoría</label>
                  <select 
                    value={newAccount.category}
                    onChange={handleCategoryChange}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    {predefinedCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {isCustomCategory && (
                    <input 
                      type="text" 
                      placeholder="Escribe la categoría..." 
                      required 
                      value={newAccount.customCategory} 
                      onChange={(e) => setNewAccount({...newAccount, customCategory: e.target.value})} 
                      className="w-full mt-2 bg-slate-900 border border-emerald-500/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Nombre</label>
                  <input type="text" placeholder="Ej. Klar" required value={newAccount.accountName} onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"/>
                </div>
              </div>

              {accountStatus === 'existing' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700 mt-4">
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1">Depositado Inicial</label>
                    <input type="number" step="0.01" required value={newAccount.deposited} onChange={(e) => setNewAccount({...newAccount, deposited: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1">Valor Real Actual</label>
                    <input type="number" step="0.01" required value={newAccount.realValue} onChange={(e) => setNewAccount({...newAccount, realValue: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"/>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsNewAccountModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-bold">Guardar Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PANEL DE DETALLES */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900/80 p-6 border-b border-slate-700 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedAccount.accountName}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${getTypeColor(selectedAccount.investmentType)}`}>{selectedAccount.category}</span>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="text-slate-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 bg-slate-800/50 border-b border-slate-700 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 font-medium">Depositado Total</p>
                <p className="text-xl font-bold text-white">{formatCurrency(selectedAccount.deposited)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Valor Real Actual</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(selectedAccount.realValue)}</p>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Historial de Movimientos</h3>
                <button 
                  onClick={() => setIsNewWeekModalOpen(true)}
                  className="text-xs bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-white rounded font-bold transition-colors shadow-sm"
                >
                  + Registrar Movimiento
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400 bg-slate-900/50">
                  <tr>
                    <th className="p-3 font-semibold rounded-l-lg">Semana</th>
                    <th className="p-3 font-semibold text-right rounded-r-lg">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {weeklyHistory.map((week) => (
                    <tr key={week.id} className="hover:bg-slate-700/30">
                      <td className="p-3 text-slate-300">{week.weekStart} - {week.weekEnd}</td>
                      <td className={`p-3 text-right font-bold ${week.amount > 0 ? 'text-emerald-400' : week.amount < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {formatCurrency(week.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. NUEVO MODAL INTELIGENTE DE MOVIMIENTO   */}
      {/* ========================================== */}
      {isNewWeekModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-white mb-6">Registrar Movimiento</h2>
            
            <form onSubmit={handleAddMovement} className="space-y-5">
              
              {/* Botones de Selección de Tipo */}
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                {['Depósito', 'Retiro', 'Gasto'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewMovement({...newMovement, type})}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                      newMovement.type === type 
                        ? type === 'Depósito' ? 'bg-emerald-500 text-white shadow' : 'bg-red-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Día de la transacción</label>
                {/* Usamos input type="date" para que salga el calendario nativo */}
                <input 
                  type="date" 
                  required 
                  value={newMovement.date} 
                  onChange={(e) => setNewMovement({...newMovement, date: e.target.value})} 
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
                
                {/* Previsualización mágica de la semana calculada */}
                {newMovement.date && (
                  <p className="text-xs text-emerald-400 mt-2 font-medium bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    Semana a registrar: <br/>
                    <span className="text-white">{getWeekRange(newMovement.date)}</span>
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Importe Exacto (MXN)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ej. 1500" 
                  required 
                  value={newMovement.amount} 
                  onChange={(e) => setNewMovement({...newMovement, amount: e.target.value})} 
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-4 mt-8 pt-2">
                <button type="button" onClick={() => setIsNewWeekModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}