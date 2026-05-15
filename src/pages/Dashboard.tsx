import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 1. Creamos el "molde" para que TypeScript deje de quejarse del "any"
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

// 2. Movemos el componente AFUERA del Dashboard para que React no lo recree
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-white font-bold">{payload[0].name}</p>
        <p className="text-emerald-400 font-medium">{`${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Estado para guardar los números del backend
  const [summary, setSummary] = useState({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [, setIsLoading] = useState(true);

  // MOCK DATA: Los porcentajes exactos de tus gráficas de Excel
  const valorTotalData = [
    { name: 'Criptomonedas', value: 75.2, color: '#F87171' }, // Red-400
    { name: 'Sofipos', value: 11.4, color: '#FACC15' },       // Yellow-400
    { name: 'Fintec', value: 7.0, color: '#4ADE80' },         // Green-400
    { name: 'Efectivo', value: 4.7, color: '#60A5FA' },       // Blue-400
    { name: 'Acciones', value: 1.1, color: '#C084FC' },       // Purple-400
    { name: 'ETFs', value: 0.6, color: '#FB923C' },           // Orange-400
  ];

  const sinEfectivoData = [
    { name: 'Criptomonedas', value: 78.9, color: '#F87171' },
    { name: 'Sofipos', value: 12.0, color: '#FACC15' },
    { name: 'Fintec', value: 7.3, color: '#4ADE80' },
    { name: 'Acciones', value: 1.2, color: '#C084FC' },
    { name: 'ETFs', value: 0.6, color: '#FB923C' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSummary(response.data);
      } catch (error) {
        console.error('Error al cargar la información financiera:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-emerald-400">Resumen Financiero</h1>
      </div>
      
      {/* 1. Tarjetas de Métricas (Las que vienen de tu Backend) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Activos (Cuentas)</h2>
          <p className="text-3xl font-bold text-white">{formatCurrency(summary.totalAssets)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Pasivos (Deudas)</h2>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(summary.totalLiabilities)}</p>
        </div>
        <div className="bg-emerald-500 p-6 rounded-2xl border border-emerald-400 shadow-lg shadow-emerald-500/20">
          <h2 className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-2">Patrimonio Neto</h2>
          <p className="text-4xl font-extrabold text-white">{formatCurrency(summary.netWorth)}</p>
        </div>
      </div>

      {/* 2. Sección de Gráficas */}
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Distribución del Portafolio</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gráfica 1: Valor Total */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">Valor Total</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={valorTotalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80} // Esto lo hace ver como una "Dona", quítalo si lo prefieres sólido
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {valorTotalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Sin Efectivo */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">Sin Efectivo</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sinEfectivoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {sinEfectivoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}