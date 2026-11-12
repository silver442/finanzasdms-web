import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { utilizationColor } from '../../utils/creditCards';

interface UtilizationRingProps {
  /** Porcentaje de la línea utilizado (0-100+) */
  pct: number;
  size?: 'sm' | 'lg';
}

const TRACK_COLOR = '#1E3A3A';

export default function UtilizationRing({ pct, size = 'lg' }: UtilizationRingProps) {
  const clamped = Math.min(100, Math.max(0, pct));
  const data = [{ name: 'usado', value: clamped }, { name: 'libre', value: 100 - clamped }];
  const box = size === 'lg' ? 'w-32 h-32' : 'w-12 h-12';

  return (
    <div className={`relative ${box} shrink-0`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={size === 'lg' ? '78%' : '70%'}
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            cornerRadius={clamped > 0 && clamped < 100 ? 8 : 0}
            isAnimationActive={false}
          >
            <Cell fill={utilizationColor(pct)} />
            <Cell fill={TRACK_COLOR} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {size === 'lg' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-white">{pct.toFixed(1)}%</span>
          <span className="text-xs text-text-secondary">Utilizado</span>
        </div>
      )}
    </div>
  );
}
