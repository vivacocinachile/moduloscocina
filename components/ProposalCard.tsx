'use client';
import { Run, getItem, kitchenTotals, isTall, fmt$ } from '@/lib/rules';

// Vista previa liviana del muro (barras proporcionales al ancho de cada módulo).
// La planta 2D completa (con esquinas, puertas, ventanas) llega en la etapa del editor.
function WallPreview({ runs }: { runs: Run[] }) {
  const maxLen = Math.max(...runs.map((r) => r.length), 1);
  return (
    <div className="flex flex-col gap-1">
      {runs.map((r, i) => {
        const used = r.slots.reduce((a, s) => a + (getItem(s.b)?.W || 0), 0);
        return (
          <div key={i} className="flex items-stretch h-6 rounded overflow-hidden border border-line" style={{ width: `${(r.length / maxLen) * 100}%` }}>
            {r.slots.map((s, j) => {
              const m = getItem(s.b);
              if (!m) return null;
              const ref = (m as any).kind === 'ref';
              return (
                <div
                  key={j}
                  title={`${m.code} · ${m.W} mm`}
                  className={`h-full border-r border-line/60 last:border-r-0 flex items-center justify-center text-[9px] overflow-hidden ${ref ? 'bg-white' : isTall(m) ? 'bg-ink2/40' : 'bg-accent/25'}`}
                  style={{ width: `${(m.W / used) * 100}%` }}
                >
                  {m.W >= 500 ? m.fam : ''}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function ProposalCard({
  nombre, desc, runs, notas, onUse,
}: { nombre: string; desc: string; runs: Run[]; notas: string[]; onUse: () => void }) {
  const t = kitchenTotals(runs);
  return (
    <div className="border border-line rounded-md bg-panel p-3 flex flex-col gap-2">
      <h3 className="font-cond text-lg">{nombre}</h3>
      <p className="text-xs text-ink2 -mt-1">{desc}</p>
      <WallPreview runs={runs} />
      {notas.length > 0 && (
        <ul className="text-xs text-ink2 list-disc pl-4">
          {notas.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm mt-1">
        <dt className="text-ink2">Módulos</dt><dd className="text-right">{t.n}</dd>
        <dt className="text-ink2">Bajos</dt><dd className="text-right">{t.ml.toFixed(2)} ml</dd>
        <dt className="text-ink2">Aéreos</dt><dd className="text-right">{t.mlAereo.toFixed(2)} ml</dd>
      </dl>
      <div className="font-cond text-2xl mt-1">{fmt$(t.total)}</div>
      <p className="text-xs text-ink2 -mt-1">Neto {fmt$(t.sub)} · IVA {fmt$(t.iva)}</p>
      <button onClick={onUse} className="mt-1 bg-accent text-white rounded-md py-1.5 text-sm">Usar esta propuesta</button>
    </div>
  );
}
