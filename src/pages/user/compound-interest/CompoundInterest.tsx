import { useState } from 'react';
import { CalendarRange, GraduationCap, Scale, Sprout } from 'lucide-react';
import { readPref, writePref } from '../crypto/utils/storage';
import SimpleVsCompoundTab from './SimpleVsCompoundTab';
import MonthlyProjectionTab from './MonthlyProjectionTab';
import CoursePlanTab from './CoursePlanTab';

const TABS = [
  { id: 'simple', label: 'Simple vs. Compuesto', shortLabel: 'Simple vs. Comp.', icon: Scale },
  { id: 'monthly', label: 'Proyección Mensual', shortLabel: 'Mensual', icon: CalendarRange },
  { id: 'course', label: 'Plan del Curso (24 Sesiones)', shortLabel: 'Curso', icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]['id'];
const TAB_IDS = TABS.map((t) => t.id);

export default function CompoundInterest() {
  const [activeTab, setActiveTab] = useState<TabId>(() => readPref('compound.activeTab', TAB_IDS, 'simple'));

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    writePref('compound.activeTab', id);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 text-white font-sans max-w-7xl mx-auto relative">
      <header className="flex items-center gap-3 md:gap-4 mb-5 md:mb-7">
        <Sprout className="w-10 h-10 md:w-14 md:h-14 shrink-0 text-brand-green-light" strokeWidth={2.5} />
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white">Interés Compuesto</h1>
          <p className="text-sm md:text-base text-text-secondary mt-1">Simula cómo crece tu dinero cuando los rendimientos también generan rendimientos.</p>
        </div>
      </header>

      <div role="tablist" aria-label="Calculadoras de interés compuesto" className="flex gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden mb-6 md:mb-8 border-b border-brand-green/40">
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold whitespace-nowrap rounded-t-xl border border-b-0 transition-colors ${isActive ? 'bg-gradient-to-b from-brand-green/40 to-brand-green/10 border-brand-green/50 text-white' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              <Icon size={18} />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === 'simple' && <SimpleVsCompoundTab />}
        {activeTab === 'monthly' && <MonthlyProjectionTab />}
        {activeTab === 'course' && <CoursePlanTab />}
      </div>
    </div>
  );
}
