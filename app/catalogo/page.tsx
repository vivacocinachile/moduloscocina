'use client';
import { useMemo, useState } from 'react';
import { buildLibrary, FAM, Modulo } from '@/lib/modules';
import { ModuleCard } from '@/components/ModuleCard';
import { ModuleDetail } from '@/components/ModuleDetail';

export default function CatalogoPage() {
  const library = useMemo(() => buildLibrary(), []);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Modulo | null>(null);

  const groups = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const g: Record<string, Modulo[]> = {};
    for (const m of library) {
      if (qq && !(m.code + ' ' + m.name).toLowerCase().includes(qq)) continue;
      const label = FAM[m.fam]?.nombre || m.fam;
      (g[label] = g[label] || []).push(m);
    }
    return g;
  }, [library, q]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-panel border-b border-line px-4 py-2 flex items-center gap-4">
        <h1 className="font-cond text-lg">Módulos VivaCocina</h1>
        <span className="text-xs text-ink2">{library.length} módulos en la biblioteca</span>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-4 p-4 max-w-6xl mx-auto">
        <aside className="border border-line rounded-md bg-panel p-3">
          <input
            className="w-full border border-line rounded-md px-2 py-1.5 mb-3 bg-panel"
            placeholder="Buscar módulo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-col gap-3 max-h-[75vh] overflow-auto">
            {Object.keys(groups).sort().map((label) => (
              <div key={label}>
                <h3 className="font-cond text-base mb-1">{label} <span className="text-xs text-ink2">({groups[label].length})</span></h3>
                <div className="flex flex-col gap-0.5">
                  {groups[label].map((m) => (
                    <ModuleCard key={m.code} m={m} selected={sel?.code === m.code} onClick={() => setSel(m)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <section>
          {sel ? <ModuleDetail m={sel} /> : (
            <div className="border border-line rounded-md bg-panel p-6 text-ink2 text-sm">
              Elige un módulo de la lista para ver su ficha completa: dibujos, despiece, herrajes y costo.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
