import {
  ArrowLeft, CalendarPlus, CheckCircle2, Eye, EyeOff, HandCoins, Info, Mail, ShieldCheck, UserCheck, Users,
} from 'lucide-react';

interface HowSharingWorksProps {
  onBack: () => void;
  onStartSharing: () => void;
}

const STEPS = [
  {
    Icon: CalendarPlus,
    title: 'Registra la suscripción',
    text: 'Agrega el servicio con su monto, frecuencia y día de cobro. Tú eres quien la paga y administra.',
  },
  {
    Icon: Mail,
    title: 'Invita a miembros de Cashi',
    text: 'Busca a la persona por su correo. Solo puedes compartir con usuarios registrados; si aún no tiene cuenta, envíale el enlace de registro.',
  },
  {
    Icon: UserCheck,
    title: 'Ellos aceptan la invitación',
    text: 'La invitación les aparece en la pestaña "Compartidas conmigo", donde pueden aceptarla o rechazarla.',
  },
  {
    Icon: HandCoins,
    title: 'Dividan y lleven el control',
    text: 'El costo se reparte entre tú y quienes aceptaron. Cada quien marca su pago y tú ves quién ya cumplió.',
  },
];

// Pantalla informativa del módulo: se muestra dentro de Suscripciones, sin salir de la página
export default function HowSharingWorks({ onBack, onStartSharing }: HowSharingWorksProps) {
  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="self-start inline-flex items-center gap-2 text-text-secondary hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Volver a mis suscripciones
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-brand-green/25 bg-gradient-to-r from-surface-card via-brand-green-dark/30 to-brand-green/30 p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="bg-brand-green/15 border border-brand-green/30 rounded-2xl p-3 shrink-0">
            <Users size={28} className="text-brand-green-light" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">¿Cómo funciona compartir?</h2>
            <p className="text-text-secondary mt-1">
              Divide el costo de tus suscripciones con amigos, familiares o roomies que también usan Cashi, y lleva el control de quién ya pagó.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map(({ Icon, title, text }, i) => (
          <div key={title} className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-2.5">
                <Icon size={20} className="text-brand-green-light" />
              </div>
              <span className="text-3xl font-black text-white/10">{i + 1}</span>
            </div>
            <p className="font-semibold text-white">{title}</p>
            <p className="text-text-secondary text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ejemplo del cálculo */}
        <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
          <p className="font-semibold text-white">¿Cuánto paga cada quien?</p>
          <div className="bg-surface-base/60 rounded-xl p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-widest font-semibold">Fórmula</p>
            <p className="text-white font-bold mt-1">Monto ÷ (miembros que aceptaron + tú)</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-text-secondary"><span>Suscripción de $300.00 al mes</span><span className="text-white font-semibold">$300.00</span></div>
            <div className="flex justify-between text-text-secondary"><span>Tú + 2 miembros que aceptaron</span><span className="text-white font-semibold">÷ 3</span></div>
            <div className="flex justify-between border-t border-surface-border pt-2"><span className="text-white font-semibold">Cada quien paga</span><span className="text-brand-green-light font-bold">$100.00</span></div>
          </div>
          <p className="text-text-muted text-xs">Mientras alguien no acepte, no cuenta en la división. Si alguien rechaza o lo remueves, la parte de cada quien se recalcula.</p>
        </div>

        {/* Privacidad */}
        <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
          <p className="font-semibold text-white flex items-center gap-2"><ShieldCheck size={18} className="text-brand-green-light" /> Tus datos siempre seguros</p>
          <div className="flex gap-3">
            <Eye size={18} className="text-brand-green-light shrink-0 mt-0.5" />
            <p className="text-text-secondary text-sm"><span className="text-white font-medium">Tus invitados ven:</span> el nombre del servicio, el monto total, su parte, la frecuencia y el día de cobro, y tu nombre.</p>
          </div>
          <div className="flex gap-3">
            <EyeOff size={18} className="text-text-muted shrink-0 mt-0.5" />
            <p className="text-text-secondary text-sm"><span className="text-white font-medium">Nunca ven:</span> tu tarjeta vinculada, tus otras suscripciones ni los correos de los demás miembros.</p>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 size={18} className="text-brand-green-light shrink-0 mt-0.5" />
            <p className="text-text-secondary text-sm"><span className="text-white font-medium">Tú tienes el control:</span> puedes invitar, remover miembros o dejar de compartir en cualquier momento.</p>
          </div>
          <div className="flex gap-3 bg-surface-base/50 rounded-xl p-3">
            <Info size={18} className="text-text-muted shrink-0 mt-0.5" />
            <p className="text-text-muted text-xs">Cashi no cobra ni mueve dinero entre miembros: los pagos se hacen por fuera y aquí solo se registran para llevar el control.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onStartSharing}
          className="bg-brand-green hover:bg-brand-green-light text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2"
        >
          <Users size={18} /> Compartir una suscripción
        </button>
        <button
          onClick={onBack}
          className="bg-surface-elevated hover:bg-surface-elevated/70 text-white px-6 py-3 rounded-2xl font-semibold transition-all"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
