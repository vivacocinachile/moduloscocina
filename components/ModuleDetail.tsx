'use client';
import { Modulo, costModule, fmt$ } from '@/lib/modules';
import { ModuleFront, ModuleSide } from './ModuleDrawing';

const MAT_LABEL: Record<string, string> = { C: 'Melamina', F: 'Frente', B: 'HDF 3' };

export function ModuleDetail({ m }: { m: Modulo }) {
  const c = costModule(m);
  return (
    <div className="border border-line rounded-md bg-panel p-3.5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-cond text-3xl leading-none">{m.code}</div>
          <p className="text-ink2 text-sm mt-0.5">{m.name} · {m.config}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 items-end">
        <figure className="m-0">
          <ModuleFront m={m} />
          <figcaption className="text-xs text-ink2 text-center">Frente</figcaption>
        </figure>
        <figure className="m-0">
          <ModuleSide m={m} />
          <figcaption className="text-xs text-ink2 text-center">Corte lateral</figcaption>
        </figure>
      </div>

      <h3 className="font-cond text-lg mt-3">Datos</h3>
      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5 text-sm">
        <dt className="text-ink2">Medidas (ancho × alto × prof.)</dt><dd className="text-right">{m.W} × {m.H} × {m.D} mm</dd>
        <dt className="text-ink2">Piezas</dt><dd className="text-right">{m.pieces}</dd>
      </dl>
      {m.notes.map((n, i) => <p key={i} className="text-xs text-ink2">{n}</p>)}

      <h3 className="font-cond text-lg mt-3">Despiece</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-ink2 text-xs border-b border-line">
            <th className="text-left py-1">#</th><th className="text-left">Pieza</th>
            <th className="text-right">Cant.</th><th className="text-right">Largo</th>
            <th className="text-right">Ancho</th><th className="text-left">Material</th>
          </tr>
        </thead>
        <tbody>
          {m.parts.map((p, i) => (
            <tr key={i} className="border-b border-line">
              <td className="py-1">{i + 1}</td>
              <td>{p.n}{p.note ? <div className="text-xs text-ink2">{p.note}</div> : null}</td>
              <td className="text-right">{p.q}</td>
              <td className="text-right">{p.l}</td>
              <td className="text-right">{p.w}</td>
              <td>{MAT_LABEL[p.mat]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="font-cond text-lg mt-3">Herrajes</h3>
      <table className="w-full text-sm border-collapse">
        <tbody>
          {c.herrLines.map((l) => (
            <tr key={l.k} className="border-b border-line">
              <td className="py-1">{l.nombre}</td>
              <td className="text-right">{l.q}</td>
              <td className="text-right">{fmt$(l.q * l.precio)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="font-cond text-lg mt-3">Costo</h3>
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border-b border-line"><td className="py-1">Materiales</td><td className="text-right">{fmt$(c.materiales)}</td></tr>
          <tr className="border-b border-line"><td className="py-1">Tapacanto</td><td className="text-right">{fmt$(c.tapacanto)}</td></tr>
          <tr className="border-b border-line"><td className="py-1">Herrajes</td><td className="text-right">{fmt$(c.herrajes)}</td></tr>
          <tr className="border-b border-line"><td className="py-1">Mano de obra</td><td className="text-right">{fmt$(c.mo)}</td></tr>
          <tr className="border-t-2 border-ink font-semibold"><td className="py-1">Precio de venta</td><td className="text-right">{fmt$(c.precio)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
