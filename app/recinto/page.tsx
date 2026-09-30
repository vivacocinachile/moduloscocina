'use client';
import { useEffect, useState } from 'react';
import { STRATS, propose, Propuesta, Entrada } from '@/lib/rules';
import { useReglas } from '@/lib/useReglas';
import Link from 'next/link';
import { ProposalCard } from '@/components/ProposalCard';
import { supabase } from '@/lib/supabase';
import { AuthBar } from '@/components/AuthBar';
import { useRouter } from 'next/navigation';



export default function RecintoPage() {
  const { rules, loaded } = useReglas();
  const [g, setG] = useState<Entrada>({ tipo: 'lineal', L: [3200, 2400, 2400], v: 'H70', lav: 600, ref: 0, aereos: true });
  const [props, setProps] = useState<{ nombre: string; desc: string; p: Propuesta }[]>([]);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState('');
  const router = useRouter();

  const tipos = Object.keys(rules);
  const muros = rules[g.tipo]?.muros || [];
  useEffect(() => { if (!rules[g.tipo] && tipos[0]) setG((old) => ({ ...old, tipo: tipos[0] })); }, [rules]);

  function generar() {
    setErr(''); setSaved('');
    const out: { nombre: string; desc: string; p: Propuesta }[] = [];
    let firstError = '';
    for (const st of STRATS) {
      const r = propose(rules, g, st);
      if ('error' in r) { if (!firstError) firstError = r.error; continue; }
      out.push({ nombre: st.nombre, desc: st.desc, p: r });
    }
    if (!out.length) setErr(firstError || 'No se pudo generar ninguna propuesta.');
    setProps(out);
  }

  async function usar(p: Propuesta) {
    if (!supabase) { setSaved('Modo local: conecta Supabase (variables de entorno) para guardar la cocina.'); return; }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setSaved('Inicia sesión para guardar esta propuesta como cocina.'); return; }
    const row = {
      user_id: session.session.user.id,
      nombre: 'Cocina ' + rules[g.tipo].nombre,
      data: { variant: p.variant, ivaOn: true, runs: p.runs },
    };
    const r = await supabase.from('vc_cocinas').insert(row).select('id').single();
    if (r.error) setSaved('No se pudo guardar: ' + r.error.message);
    else router.push(`/cocina/${r.data.id}`);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-panel border-b border-line px-4 py-2 flex items-center gap-4 flex-wrap">
        <h1 className="font-cond text-lg">Recinto y propuestas</h1>
        <Link href="/reglas" className="text-sm underline">Reglas de diseño</Link>
        <div className="ml-auto"><AuthBar /></div>
      </header>
      <div className="max-w-4xl mx-auto p-4">
        {!loaded && <p className="text-sm text-ink2 mb-2">Cargando reglas…</p>}
        <section className="border border-line rounded-md bg-panel p-4">
          <h2 className="font-cond text-xl mb-2">1. Recinto</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1 text-sm text-ink2">
              Tipo de cocina
              <select className="border border-line rounded-md px-2 py-1 bg-panel" value={g.tipo} onChange={(e) => setG({ ...g, tipo: e.target.value })}>
                {tipos.map((t) => <option key={t} value={t}>{rules[t].nombre}</option>)}
              </select>
            </label>
            {muros.map((m, i) => (
              <label key={i} className="flex flex-col gap-1 text-sm text-ink2">
                {m.nombre} (mm)
                <input type="number" className="border border-line rounded-md px-2 py-1 bg-panel"
                  value={g.L[i] || 0}
                  onChange={(e) => { const L = [...g.L]; L[i] = +e.target.value; setG({ ...g, L }); }} />
              </label>
            ))}
            <label className="flex flex-col gap-1 text-sm text-ink2">
              Altura de bajos
              <select className="border border-line rounded-md px-2 py-1 bg-panel" value={g.v} onChange={(e) => setG({ ...g, v: e.target.value })}>
                <option value="H70">H70</option><option value="H80">H80</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink2">
              Lavaplatos preferido
              <select className="border border-line rounded-md px-2 py-1 bg-panel" value={g.lav} onChange={(e) => setG({ ...g, lav: +e.target.value })}>
                {[600, 800, 900].map((w) => <option key={w} value={w}>{w} mm</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink2">
              Refrigerador (mm, 0 = no)
              <input type="number" className="border border-line rounded-md px-2 py-1 bg-panel" value={g.ref} onChange={(e) => setG({ ...g, ref: +e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm mt-5">
              <input type="checkbox" checked={g.aereos} onChange={(e) => setG({ ...g, aereos: e.target.checked })} />
              Incluir aéreos
            </label>
          </div>
          <button onClick={generar} className="mt-3 bg-accent text-white rounded-md px-4 py-2 text-sm">Generar propuestas</button>
          {err && <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
        </section>

        {props.length > 0 && (
          <section className="mt-6">
            <h2 className="font-cond text-xl mb-2">2. Propuestas</h2>
            {saved && <div className="mb-2 text-sm bg-soft border border-line rounded-md px-3 py-2">{saved}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {props.map((pp, i) => (
                <ProposalCard key={i} nombre={pp.nombre} desc={pp.desc} runs={pp.p.runs} notas={pp.p.notas} onUse={() => usar(pp.p)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
