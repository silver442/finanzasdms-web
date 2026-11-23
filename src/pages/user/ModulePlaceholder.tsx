// Página en blanco para módulos habilitados (Solo Admin/Público) que aún no tienen contenido
export default function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-4 sm:p-6 md:p-8 text-white max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-4xl font-extrabold text-white">{title}</h1>
    </div>
  );
}
