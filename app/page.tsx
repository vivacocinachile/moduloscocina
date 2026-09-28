import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="font-cond text-3xl mb-2">Módulos VivaCocina</h1>
      <p className="text-ink2 mb-6">Versión en Next.js — etapa 1: catálogo de módulos.</p>
      <div className="flex gap-3">
        <Link href="/catalogo" className="inline-block bg-accent text-white px-4 py-2 rounded-md">
          Ir al catálogo →
        </Link>
        <Link href="/recinto" className="inline-block border border-line px-4 py-2 rounded-md">
          Recinto y propuestas →
        </Link>
      </div>
    </main>
  );
}
