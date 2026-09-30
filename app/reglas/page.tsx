'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthBar } from '@/components/AuthBar';
import { useReglas } from '@/lib/useReglas';
import { RuleType, RuleItem } from '@/lib/rules';
import { FAM } from '@/lib/modules';

const FAM_KEYS = Object.keys(FAM);

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

export default function ReglasPage() {
  const { rules, guardar, resetear, loaded, msg, session } = useReglas();
  const tipos = Object.keys(rules);
  const [tSel, setTSel] = useState(tipos[0] || 'lineal');
  const active = rules[tSel] || rules[tipos[0]];

  function update(next: Record<string, RuleType>) { guardar(next); }

  function setTipo(fn: (t: RuleType) => RuleType) {
    const next = clone(rules);
    next[tSel] = fn(clone(active));
    update(next);
  }

  function addMuro() {
    setTipo((t) => { t.muros.push({ nombre: 'Muro ' + String.fromCharCode(65 + t.muros.length), desc: 1, pared: 'O', items: [{ k: 'FILL', peso: 100 }] }); return t; });
  }
  function delMuro(i: number) {
    setTipo((t) => { if (t.muros.length > 1) t.muros.splice(i, 1); return t; });
  }
  function addItem(mi: number) {
    setTipo((t) => { t.muros[mi].items.push({ k: 'MOD', fams: ['BA'], pref: 600, req: true }); return t; });
  }
  function delItem(mi: number, ii: number) {
    setTipo((t) => { t.muros[mi].items.splice(ii, 1); return t; });
  }
  function setItem(mi: number, ii: number, item: RuleItem) {
    setTipo((t) => { t.muros[mi].items[ii] = item; return t; });
  }

  function nuevoTipo() {
    const key = 'tipo' + Date.now().toString(36);
    const next = clone(rules);
    next[key] = clone(active) || { nombre: 'Nuevo tipo', muros: [{ nombre: 'Muro A', desc: 0, pared: 'N', items: [{ k: 'FILL', peso: 100 }] }] };
    next[key].nombre = (next[key].nombre || 'Tipo') + ' (copia)';
    update(next);
    setTSel(key);
  }
  function borrarTipo() {
    if (tipos.length <= 1) return;
    if (!confirm(`¿Eliminar el tipo "${active.nombre}"?`)) return;
    const next = clone(rules);
    delete next[tSel];
    update(next);
    setTSel(Object.keys(next)[0]);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-panel border-b border-line px-4 py-2 flex items-center gap-4 flex-wrap">
        <h1 className="font-cond text-lg">Reglas de diseño</h1>
        <Link href="/recinto" className="text-sm underline">← Recinto y propuestas</Link>
        <div className="ml-auto"><AuthBar /></div>
      </header>
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-sm text-ink2 mb-3">
          Cada tipo de cocina tiene una receta por muro: una lista de elementos obligatorios
          (módulo, hueco de refrigerador o zona libre que se completa con bajos). Esto es lo
          que usa "Generar propuestas" en Recinto.
        </p>
        {!session && <p className="text-sm bg-soft border border-line rounded-md px-3 py-2 mb-3">Inicia sesión (arriba) para guardar tus propias reglas; sin sesión, ves y pruebas las de fábrica.</p>}
        {msg && <div className="mb-3 text-sm bg-soft border border-line rounded-md px-3 py-2">{msg}</div>}
        {!loaded && <p className="text-sm text-ink2">Cargando…</p>}

        {loaded && active && (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <select className="border border-line rounded-md px-2 py-1 bg-panel" value={tSel} onChange={(e) => setTSel(e.target.value)}>
                {tipos.map((t) => <option key={t} value={t}>{rules[t].nombre}</option>)}
              </select>
              <input className="border border-line rounded-md px-2 py-1 bg-panel" value={active.nombre}
                onChange={(e) => setTipo((t) => { t.nombre = e.target.value; return t; })} />
              <button onClick={nuevoTipo} className="text-xs border border-line rounded-md px-2 py-1">Duplicar como tipo nuevo</button>
              {tipos.length > 1 && <button onClick={borrarTipo} className="text-xs border border-line rounded-md px-2 py-1 text-red-700">Eliminar este tipo</button>}
              <button onClick={resetear} className="text-xs border border-line rounded-md px-2 py-1 ml-auto">Restablecer reglas de fábrica</button>
            </div>

            <div className="flex flex-col gap-4">
              {active.muros.map((mu, mi) => (
                <div key={mi} className="border border-line rounded-md bg-soft p-3">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <input className="border border-line rounded-md px-2 py-1 bg-panel w-32" value={mu.nombre}
                      onChange={(e) => setTipo((t) => { t.muros[mi].nombre = e.target.value; return t; })} />
                    <label className="flex items-center gap-1 text-sm">Pared
                      <select className="border border-line rounded-md px-1 py-1 bg-panel" value={mu.pared}
                        onChange={(e) => setTipo((t) => { t.muros[mi].pared = e.target.value as any; return t; })}>
                        <option value="N">Norte</option><option value="S">Sur</option><option value="O">Oeste</option><option value="E">Este</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={!!mu.desc} onChange={(e) => setTipo((t) => { t.muros[mi].desc = e.target.checked ? 1 : 0; return t; })} />
                      Descuenta profundidad (llega a una esquina)
                    </label>
                    {active.muros.length > 1 && <button onClick={() => delMuro(mi)} className="text-xs text-red-700 ml-auto">Quitar muro</button>}
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-ink2 text-xs"><th className="text-left">#</th><th className="text-left">Elemento</th><th className="text-left">Detalle</th><th></th></tr></thead>
                    <tbody>
                      {mu.items.map((it, ii) => (
                        <tr key={ii} className="border-t border-line">
                          <td className="py-1">{ii + 1}</td>
                          <td>
                            <select className="border border-line rounded-md px-1 py-0.5 bg-panel" value={it.k}
                              onChange={(e) => {
                                const k = e.target.value as RuleItem['k'];
                                setItem(mi, ii, k === 'MOD' ? { k: 'MOD', fams: ['BA'], pref: 600, req: true } : k === 'FILL' ? { k: 'FILL', peso: 50 } : { k: 'REF' });
                              }}>
                              <option value="MOD">Módulo</option>
                              <option value="REF">Hueco de refrigerador</option>
                              <option value="FILL">Zona libre</option>
                            </select>
                          </td>
                          <td className="flex flex-wrap items-center gap-2 py-1">
                            {it.k === 'MOD' && (
                              <>
                                <select className="border border-line rounded-md px-1 py-0.5 bg-panel" value={it.fams[0]}
                                  onChange={(e) => setItem(mi, ii, { ...it, fams: [e.target.value, ...it.fams.slice(1)] })}>
                                  {FAM_KEYS.map((f) => <option key={f} value={f}>{FAM[f].nombre}</option>)}
                                </select>
                                <label className="text-xs text-ink2">Ancho preferido
                                  <select className="border border-line rounded-md px-1 py-0.5 bg-panel ml-1" value={it.pref}
                                    onChange={(e) => setItem(mi, ii, { ...it, pref: +e.target.value })}>
                                    {(FAM[it.fams[0]]?.widths || []).map((w) => <option key={w} value={w}>{w} mm</option>)}
                                  </select>
                                </label>
                                <label className="text-xs flex items-center gap-1">
                                  <input type="checkbox" checked={it.req} onChange={(e) => setItem(mi, ii, { ...it, req: e.target.checked })} />
                                  Obligatorio
                                </label>
                              </>
                            )}
                            {it.k === 'FILL' && (
                              <label className="text-xs text-ink2">Peso relativo
                                <input type="number" min={1} className="border border-line rounded-md px-1 py-0.5 bg-panel ml-1 w-16"
                                  value={it.peso} onChange={(e) => setItem(mi, ii, { ...it, peso: Math.max(1, +e.target.value) })} />
                              </label>
                            )}
                            {it.k === 'REF' && <span className="text-xs text-ink2">El ancho viene del recinto (campo Refrigerador).</span>}
                          </td>
                          <td><button onClick={() => delItem(mi, ii)} className="text-xs text-red-700">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => addItem(mi)} className="text-xs border border-line rounded-md px-2 py-1 mt-2">Agregar elemento</button>
                </div>
              ))}
            </div>
            {active.muros.length < 3 && <button onClick={addMuro} className="mt-3 text-sm border border-line rounded-md px-3 py-1.5">Agregar muro</button>}
          </>
        )}
      </div>
    </div>
  );
}
