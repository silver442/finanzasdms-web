import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800/50 px-6 py-4">
        <Link to="/" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">
          ← Volver al inicio
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold">Contacto</h1>
        <p className="text-slate-400">Página en construcción.</p>
      </main>
    </div>
  );
}
