import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PaymentProgressRingProps {
  paid: number;
  total: number;
}

const PAID_COLOR = '#10B981';
const PENDING_COLOR = '#334155';

export default function PaymentProgressRing({ paid, total }: PaymentProgressRingProps) {
  const pending = Math.max(0, total - paid);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const data = total > 0
    ? [{ name: 'Pagadas', value: paid }, { name: 'Pendientes', value: pending }]
    : [{ name: 'Sin tarjetas', value: 1 }];

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="74%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cornerRadius={total > 0 && pending > 0 && paid > 0 ? 6 : 0}
              paddingAngle={paid > 0 && pending > 0 ? 3 : 0}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={total > 0 && i === 0 ? PAID_COLOR : PENDING_COLOR} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white">
          {pct}%
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Pagadas: <b>{paid}</b>
        </p>
        <p className="flex items-center gap-2 text-text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Pendientes: <b>{pending}</b>
        </p>
        <p className="text-xs text-text-muted">{total} {total === 1 ? 'tarjeta' : 'tarjetas'} en total</p>
      </div>
    </div>
  );
}
