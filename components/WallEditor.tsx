'use client';
import { FAM, Modulo } from '@/lib/modules';
import { Run, Slot, getItem, priceOf, fmt$ } from '@/lib/rules';

function baseOptions(v: string) {
  const groups: Record<string, Modulo[]> = { Bajos: [], Torres: [] };
  for (const fam of Object.keys(FAM)) {
    if (FAM[fam].vars[0]?.startsWith('T')) continue;
    if (FAM[fam].vars.includes(v)) {
      for (const w of FAM[fam].widths) { const m = getItem(`${fam}-${w}-${v}`); if (m) groups.Bajos.push(m); }
    }
  }
  for (const w of FAM.TD.widths) { const m = getItem(`TD-${w}-T210`); if (m) groups.Torres.push(m); }
  for (const w of FAM.TH.widths) { const m = getItem(`TH-${w}-T210`); if (m) groups.Torres.push(m); }
  return groups;
}

export function WallEditor({
  run, variant, onChange,
}: { run: Run; variant: string; onChange: (run: Run) => void }) {
  const groups = baseOptions(variant);

  function setSlot(i: number, code: string) {
    const slots = run.slots.slice(); slots[i] = { ...slots[i], b: code };
    onChange({ ...run, slots });
  }
  function removeSlot(i: number) {
    const slots = run.slots.slice(); slots.splice(i, 1);
    onChange({ ...run, slots });
  }
  function addSlot() {
    const first = Object.values(groups)[0]?.[0];
    if (!first) return;
    onChange({ ...run, slots: [...run.slots, { b: first.code, a: null }] });
  }

  const used = run.slots.reduce((a, s) => a + (getItem(s.b)?.W || 0), 0);

  return (
    <div className="border border-line rounded-md bg-panel p-3">
      <div className="flex items-center gap-3 mb-2">
        <b className="font-cond text-lg">{run.label}</b>
        <span className="text-xs text-ink2">{used} / {run.length} mm</span>
        <button onClick={addSlot} className="ml-auto text-xs border border-line rounded-md px-2 py-1">Agregar módulo</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-ink2 text-xs border-b border-line">
            <th className="text-left py-1">#</th><th className="text-left">Módulo</th>
            <th className="text-right">Ancho</th><th className="text-right">Precio</th><th></th>
          </tr>
        </thead>
        <tbody>
          {run.slots.map((s, i) => {
            const m = getItem(s.b);
            const isRef = (m as any)?.kind === 'ref';
            return (
              <tr key={i} className="border-b border-line">
                <td className="py-1">{i + 1}</td>
                <td>
                  {isRef ? (
                    <span>{m?.name}</span>
                  ) : (
                    <select className="border border-line rounded-md px-1 py-0.5 bg-panel" value={s.b} onChange={(e) => setSlot(i, e.target.value)}>
                      {Object.entries(groups).map(([label, mods]) => (
                        <optgroup key={label} label={label}>
                          {mods.map((mm) => <option key={mm.code} value={mm.code}>{mm.code} · {mm.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </td>
                <td className="text-right">{m?.W ?? ''}</td>
                <td className="text-right">{m ? fmt$(priceOf(m)) : ''}</td>
                <td className="text-right"><button onClick={() => removeSlot(i)} className="text-red-700 text-xs">Quitar</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
