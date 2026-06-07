import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col">
      <header className="border-b border-surface-800/50 px-6 py-4">
        <Link to="/" className="text-text-secondary hover:text-white text-sm font-semibold transition-colors">
          ← Volver al inicio
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold">Contacto</h1>
        <p className="text-text-secondary">Página en construcción.</p>
      </main>
    </div>
  );
}
