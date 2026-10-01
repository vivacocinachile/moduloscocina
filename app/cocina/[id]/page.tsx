'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/useSession';
import { AuthBar } from '@/components/AuthBar';
import { WallEditor } from '@/components/WallEditor';
import { PlanEditor } from '@/components/PlanEditor';
import { Run, kitchenTotals, fmt$ } from '@/lib/rules';

interface KitchenData { variant: string; ivaOn: boolean; runs: Run[] }

export default function CocinaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, ready } = useSession();
  const [nombre, setNombre] = useState('');
  const [data, setData] = useState<KitchenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState<{ ri: number; si: number } | null>(null);
  const [showAereos, setShowAereos] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!supabase) { setLoading(false); setMsg('Conecta Supabase (variables de entorno) para abrir cocinas guardadas.'); return; }
    if (!session) { setLoading(false); return; }
    supabase.from('vc_cocinas').select('nombre,data').eq('id', id).single().then(({ data: row, error }) => {
      if (error || !row) setMsg('No se pudo abrir esta cocina: ' + (error?.message || 'no encontrada'));
      else { setNombre(row.nombre); setData(row.data as KitchenData); }
      setLoading(false);
    });
  }, [ready, session, id]);

  function updateRun(i: number, run: Run) {
    if (!data) return;
    const runs = data.runs.slice(); runs[i] = run;
    setData({ ...data, runs });
  }

  async function guardar() {
    if (!supabase || !data) return;
    setMsg('Guardando…');
    const r = await supabase.from('vc_cocinas').update({ nombre, data, updated_at: new Date().toISOString() }).eq('id', id);
    setMsg(r.error ? 'No se pudo guardar: ' + r.error.message : 'Guardado.');
  }
  async function eliminar() {
    if (!supabase || !confirm('¿Eliminar esta cocina?')) return;
    const r = await supabase.from('vc_cocinas').delete().eq('id', id);
    if (r.error) setMsg('No se pudo eliminar: ' + r.error.message);
    else router.push('/recinto');
  }

  const t = data ? kitchenTotals(data.runs) : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-panel border-b border-line px-4 py-2 flex items-center gap-4 flex-wrap">
        <h1 className="font-cond text-lg">Editor de cocina</h1>
        <div className="ml-auto"><AuthBar /></div>
      </header>
      <div className="max-w-4xl mx-auto p-4">
        {loading && <p className="text-sm text-ink2">Cargando…</p>}
        {!loading && !session && supabase && <p className="text-sm text-ink2">Inicia sesión (arriba a la derecha) para ver esta cocina.</p>}
        {msg && <div className="mb-3 text-sm bg-soft border border-line rounded-md px-3 py-2">{msg}</div>}

        {data && (
          <>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <input className="border border-line rounded-md px-2 py-1 font-cond text-lg bg-panel" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              {t && <span className="font-cond text-2xl ml-auto">{fmt$(t.total)}</span>}
              <button onClick={guardar} className="bg-accent text-white rounded-md px-4 py-2 text-sm">Guardar</button>
              <button onClick={eliminar} className="border border-line rounded-md px-3 py-2 text-sm text-red-700">Eliminar</button>
            </div>
            <div className="border border-line rounded-md bg-panel p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-cond text-lg">Planta</h2>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={showAereos} onChange={(e) => setShowAereos(e.target.checked)} />
                  Aéreos
                </label>
              </div>
              <PlanEditor
                runs={data.runs}
                onChange={(runs) => setData({ ...data, runs })}
                selected={sel}
                onSelect={setSel}
                showAereos={showAereos}
              />
              <p className="text-xs text-ink2 mt-1">Arrastra un módulo para moverlo dentro del muro o a otro muro. Toca uno para seleccionarlo.</p>
            </div>
            {t && (
              <dl className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4 border border-line rounded-md bg-panel p-3">
                <div><span className="text-ink2 block text-xs">Módulos</span><b>{t.n}</b></div>
                <div><span className="text-ink2 block text-xs">Bajos</span><b>{t.ml.toFixed(2)} ml</b></div>
                <div><span className="text-ink2 block text-xs">Aéreos</span><b>{t.mlAereo.toFixed(2)} ml</b></div>
                <div><span className="text-ink2 block text-xs">Neto</span><b>{fmt$(t.sub)}</b></div>
                <div><span className="text-ink2 block text-xs">IVA</span><b>{fmt$(t.iva)}</b></div>
              </dl>
            )}
            <div className="flex flex-col gap-4">
              {data.runs.map((r, i) => (
                <WallEditor key={i} run={r} variant={data.variant} onChange={(run) => updateRun(i, run)} />
              ))}
            </div>
            {sel && data.runs[sel.ri]?.slots[sel.si] && (
              <div className="mt-2 text-xs text-ink2">
                Seleccionado: muro {sel.ri + 1}, posición {sel.si + 1} — {data.runs[sel.ri].slots[sel.si].b}
                <button className="ml-2 underline" onClick={() => setSel(null)}>Soltar</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
