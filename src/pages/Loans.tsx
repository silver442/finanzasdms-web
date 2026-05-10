import { useState } from 'react';
import { Landmark, Plus, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

// Estructuras de datos basadas en tu Excel
interface Installment {
  id: number;
  paymentNumber: number;
  date: string;
  expectedAmount: number;
  paidAmount: number;
}

interface Loan {
  id: string;
  name: string;
  totalDebt: number;
  installments: Installment[];
}

export default function Loans() {
  // MOCK DATA: Tus refacciones del Chevy (Banda y Manguera)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      name: 'Banda de Distribución',
      totalDebt: 900,
      installments: [
        { id: 101, paymentNumber: 1, date: '13-feb-2026', expectedAmount: 300, paidAmount: 300 },
        { id: 102, paymentNumber: 2, date: '15-mar-2026', expectedAmount: 300, paidAmount: 300 },
        { id: 103, paymentNumber: 3, date: '14-abr-2026', expectedAmount: 300, paidAmount: 300 },
      ]
    },
    {
      id: '2',
      name: 'Manguera clima',
      totalDebt: 900,
      installments: [
        { id: 201, paymentNumber: 1, date: '13-feb-2026', expectedAmount: 300, paidAmount: 300 },
        { id: 202, paymentNumber: 2, date: '15-mar-2026', expectedAmount: 300, paidAmount: 200 }, // Faltan 100
        { id: 203, paymentNumber: 3, date: '14-abr-2026', expectedAmount: 400, paidAmount: 400 },
      ]
    }
  ]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      {/* --- ENCABEZADO --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <Landmark size={32} />
            Préstamos y Pagos Fijos
          </h1>
          <p className="text-slate-400 mt-2">Control de amortizaciones y compras a plazos</p>
        </div>
        
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <Plus size={20} />
          Nuevo Préstamo
        </button>
      </div>

      {/* --- GRID DE PRÉSTAMOS --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {loans.map(loan => {
          // Matemáticas automáticas (Igual que en tu Excel)
          const totalPaid = loan.installments.reduce((acc, curr) => acc + curr.paidAmount, 0);
          const currentDebt = loan.totalDebt - totalPaid;
          const isFullyPaid = currentDebt <= 0;

          return (
            <div key={loan.id} className={`bg-slate-800 rounded-2xl border shadow-xl overflow-hidden flex flex-col ${isFullyPaid ? 'border-emerald-500/30' : 'border-slate-700'}`}>
              
              {/* Cabecera de la Tarjeta del Préstamo */}
              <div className="p-6 border-b border-slate-700 bg-slate-900/40 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {loan.name} 
                    {isFullyPaid && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/30">Liquidado</span>}
                  </h2>
                  <p className="text-sm text-slate-400">Deuda Total: {formatCurrency(loan.totalDebt)}</p>
                </div>
              </div>

              {/* Tabla de Pagos (Installments) */}
              <div className="flex-1 p-6 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="pb-3 font-semibold">N°</th>
                      <th className="pb-3 font-semibold">Fecha</th>
                      <th className="pb-3 font-semibold text-right">A pagar</th>
                      <th className="pb-3 font-semibold text-right">Abonado</th>
                      <th className="pb-3 font-semibold text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {loan.installments.map(inst => {
                      const isComplete = inst.paidAmount >= inst.expectedAmount;
                      const hasPartialPayment = inst.paidAmount > 0 && !isComplete;

                      return (
                        <tr key={inst.id} className="hover:bg-slate-700/20">
                          <td className="py-3 text-slate-400">{inst.paymentNumber}</td>
                          <td className="py-3 text-slate-300">{inst.date}</td>
                          <td className="py-3 text-right text-slate-300">{formatCurrency(inst.expectedAmount)}</td>
                          <td className={`py-3 text-right font-medium ${isComplete ? 'text-emerald-400' : hasPartialPayment ? 'text-amber-400' : 'text-white'}`}>
                            {formatCurrency(inst.paidAmount)}
                          </td>
                          <td className="py-3 flex justify-center">
                            {isComplete 
                              ? <CheckCircle2 size={18} className="text-emerald-500" />
                              : hasPartialPayment 
                                ? <AlertCircle size={18} className="text-amber-500" />
                                : <Circle size={18} className="text-slate-600" />
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resumen inferior (Totales) */}
              <div className="bg-slate-900/60 p-6 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Pagos Totales</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Deuda Actual</p>
                  <p className={`text-xl font-extrabold ${isFullyPaid ? 'text-slate-500' : 'text-red-400'}`}>
                    {formatCurrency(currentDebt)}
                  </p>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}