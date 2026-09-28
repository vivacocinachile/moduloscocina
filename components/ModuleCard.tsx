'use client';
import { Modulo, costModule, fmt$ } from '@/lib/modules';
import { ModuleFront } from './ModuleDrawing';

export function ModuleCard({ m, onClick, selected }: { m: Modulo; onClick: () => void; selected: boolean }) {
  const c = costModule(m);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-soft ${selected ? 'bg-soft ring-1 ring-accent' : ''}`}
    >
      <span className="w-9 h-9 flex-none [&_svg]:max-h-9 [&_svg]:max-w-9">
        <ModuleFront m={m} h={36} />
      </span>
      <span className="flex-1 min-w-0 flex flex-col leading-tight">
        <b className="font-cond text-base">{m.code}</b>
        <span className="text-xs text-ink2">{m.W} / {m.D} / {m.H}</span>
      </span>
      <span className="text-xs text-ink2 flex-none">{fmt$(c.precio)}</span>
    </button>
  );
}
