// Motor de reglas y generador de propuestas — portado desde modulos-vivacocina-supabase.html
// Etapa 2. Usa el mismo esquema de reglas que la versión HTML: cada tipo de cocina define,
// por muro, una lista de elementos (módulo obligatorio, hueco de refrigerador, o zona libre
// que se completa con bajos/cajoneros). Por ahora las reglas están fijas en código (RULES_DEF);
// la pantalla para editarlas (como "Reglas de diseño" en el HTML) es una etapa siguiente.
import { FAM, KIND, CFG, Modulo, buildModule, buildFiller, costModule, fmt$ } from './modules';

const fmtI = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export type RuleItem =
  | { k: 'REF' }
  | { k: 'FILL'; peso: number }
  | { k: 'MOD'; fams: string[]; pref: number; req: boolean };

export interface RuleWall { nombre: string; desc: 0 | 1; pared: 'N' | 'S' | 'O' | 'E'; items: RuleItem[] }
export interface RuleType { nombre: string; muros: RuleWall[] }

const LIN_A: RuleItem[] = [
  { k: 'REF' },
  { k: 'FILL', peso: 15 },
  { k: 'MOD', fams: ['LA'], pref: 600, req: true },
  { k: 'FILL', peso: 55 },
  { k: 'MOD', fams: ['CO'], pref: 600, req: true },
  { k: 'MOD', fams: ['HO', 'TH'], pref: 600, req: true },
  { k: 'FILL', peso: 30 },
];

export const RULES: Record<string, RuleType> = {
  lineal: { nombre: 'Lineal (cocina larga)', muros: [{ nombre: 'Muro A', desc: 0, pared: 'N', items: LIN_A }] },
  L: {
    nombre: 'En L',
    muros: [
      { nombre: 'Muro A', desc: 0, pared: 'N', items: LIN_A },
      { nombre: 'Muro B', desc: 1, pared: 'O', items: [{ k: 'FILL', peso: 100 }] },
    ],
  },
  paralela: {
    nombre: 'Paralela (cocina rectangular)',
    muros: [
      { nombre: 'Muro A', desc: 0, pared: 'N', items: [{ k: 'FILL', peso: 30 }, { k: 'MOD', fams: ['LA'], pref: 600, req: true }, { k: 'FILL', peso: 70 }] },
      { nombre: 'Muro B', desc: 0, pared: 'S', items: [{ k: 'REF' }, { k: 'FILL', peso: 20 }, { k: 'MOD', fams: ['CO'], pref: 600, req: true }, { k: 'MOD', fams: ['HO', 'TH'], pref: 600, req: true }, { k: 'FILL', peso: 80 }] },
    ],
  },
  U: {
    nombre: 'En U (cocina cuadrada)',
    muros: [
      { nombre: 'Muro A', desc: 0, pared: 'N', items: [{ k: 'FILL', peso: 30 }, { k: 'MOD', fams: ['LA'], pref: 600, req: true }, { k: 'FILL', peso: 70 }] },
      { nombre: 'Muro B', desc: 1, pared: 'O', items: [{ k: 'REF' }, { k: 'FILL', peso: 100 }] },
      { nombre: 'Muro C', desc: 1, pared: 'E', items: [{ k: 'FILL', peso: 30 }, { k: 'MOD', fams: ['CO'], pref: 600, req: true }, { k: 'MOD', fams: ['HO', 'TH'], pref: 600, req: true }, { k: 'FILL', peso: 70 }] },
    ],
  },
};

export interface Strat { id: string; nombre: string; desc: string; cost: (w: number) => number; ca: boolean }
export const STRATS: Strat[] = [
  { id: 'A', nombre: 'Menos módulos', desc: 'Anchos grandes para reducir la cantidad de módulos.', cost: (w) => 1 + (w < 400 ? 2 : 0), ca: false },
  { id: 'B', nombre: 'Base de 60', desc: 'Usa 60 cm siempre que se puede: más repetible para fabricar.', cost: (w) => (w === 600 ? 1 : 4), ca: false },
  { id: 'C', nombre: 'Más cajoneros', desc: 'Alterna cajoneros y bajos con puertas para ganar cajones.', cost: (w) => 1 + (w < 400 ? 2 : 0), ca: true },
];

// --- resolver de códigos (equivalente a getItem/BY en el HTML) ---
const cache = new Map<string, Modulo | null>();
export function getItem(code: string | null): Modulo | null {
  if (!code) return null;
  if (cache.has(code)) return cache.get(code)!;
  let m: Modulo | null = null;
  if (code.startsWith('REF-')) {
    const w = parseInt(code.split('-')[1], 10);
    m = { code, fam: 'REF', kind: 'base' as any, v: '', W: w, H: 1800, D: 0, Hc: 0, zoc: 0, name: 'Hueco refrigerador ' + fmtI(w) + ' mm', config: 'Sin fabricación', parts: [], herr: {}, front: [], shelfY: [], notes: [], noBack: true, pieces: 0 } as any;
    (m as any).kind = 'ref';
  } else if (code.startsWith('RL-')) {
    const p = code.split('-');
    m = buildFiller(parseInt(p[1], 10), p[2]);
  } else {
    const p = code.split('-');
    if (p.length === 3 && FAM[p[0]] && parseInt(p[1], 10) > 0) m = buildModule(p[0], parseInt(p[1], 10), p[2]);
  }
  cache.set(code, m);
  return m;
}
export const isTall = (m: Modulo | null) => !!m && m.kind === 'torre';
export const priceOf = (m: Modulo | null) => {
  if (!m || (m as any).kind === 'ref') return 0;
  return costModule(m).precio;
};

function famVar(fam: string, v: string): string {
  const k = KIND[fam];
  if (k === 'torre' || k === 'aereo') {
    const vs = FAM[fam]?.vars;
    return vs?.length ? vs[0] : k === 'torre' ? 'T210' : 'A70';
  }
  return v;
}

function fillDP(len: number, costFn: (w: number) => number) {
  const Ws = FAM.BA.widths.filter((w) => w % 10 === 0);
  const u = Math.floor(len / 10);
  const best = new Array(u + 1).fill(Infinity), prev = new Array(u + 1).fill(-1);
  best[0] = 0;
  for (let x = 1; x <= u; x++) for (const w of Ws) { const k = w / 10; if (x >= k && best[x - k] + costFn(w) < best[x]) { best[x] = best[x - k] + costFn(w); prev[x] = w; } }
  let x = u; while (x > 0 && !isFinite(best[x])) x--;
  const ws: number[] = []; let c = x; while (c > 0) { ws.push(prev[c]); c -= prev[c] / 10; }
  ws.sort((a, b) => b - a);
  return { ws, sum: x * 10 };
}

function resolveMod(it: { fams: string[] }, v: string) {
  for (let i = 0; i < it.fams.length; i++) {
    const f = it.fams[i]; if (!FAM[f]) continue;
    const fv = famVar(f, v);
    const ws = FAM[f].widths.filter((w) => getItem(`${f}-${w}-${fv}`));
    if (ws.length) return { fam: f, widths: ws, fell: i > 0 };
  }
  return null;
}
function combos(lists: number[][], cap: number) {
  let out: number[][] = [[]];
  for (const l of lists) { const n: number[][] = []; for (const o of out) for (const w of l) n.push(o.concat(w)); out = n; if (out.length > cap) break; }
  return out;
}

export interface Slot { b: string; a: string | null }
export interface Run { label: string; length: number; slots: Slot[]; wall: 'N' | 'S' | 'O' | 'E' }
export interface Propuesta { runs: Run[]; variant: string; notas: string[] }
export interface Entrada { tipo: string; L: number[]; v: string; lav: number; ref: number; aereos: boolean }

export function propose(g: Entrada, st: Strat): Propuesta | { error: string } {
  const tipo = RULES[g.tipo];
  if (!tipo) return { error: 'No encuentro el tipo de cocina elegido.' };
  const v = g.v, D = CFG.prof.base, notas: string[] = [], runs: Run[] = [];
  let alt = 0;
  const codeFor = (w: number) => { let fam = 'BA'; if (st.ca && getItem(`CA-${w}-${v}`) && alt % 2 === 1) fam = 'CA'; alt++; return `${fam}-${w}-${v}`; };

  for (let mi = 0; mi < tipo.muros.length; mi++) {
    const mu = tipo.muros[mi], len = g.L[mi] || 0, usable = len - (mu.desc ? D : 0);
    if (usable < 300) return { error: `El ${mu.nombre.toLowerCase()} es muy corto: quedan ${fmtI(Math.max(usable, 0))} mm útiles.` };
    const items: any[] = [];
    for (const it of mu.items) {
      if (it.k === 'REF') { if (g.ref > 0) items.push({ k: 'REF', w: g.ref }); continue; }
      if (it.k === 'FILL') { items.push({ k: 'FILL', peso: Math.max(1, it.peso || 1) }); continue; }
      if (it.k === 'MOD') {
        const r = resolveMod(it, v);
        const nombres = it.fams.map((f) => FAM[f]?.nombre.toLowerCase() || f).join(' o ');
        if (!r) {
          if (it.req === false) { notas.push(`${mu.nombre}: se omitió ${nombres} porque no existe para ${v}.`); continue; }
          return { error: `En el ${mu.nombre.toLowerCase()} la regla pide ${nombres}, pero no existe para la altura ${v}.` };
        }
        if (r.fell) notas.push(`${mu.nombre}: el ${FAM[it.fams[0]].nombre.toLowerCase()} no existe para ${v}; se usó ${FAM[r.fam].nombre.toLowerCase()}.`);
        let pref = it.pref || r.widths[0];
        if (r.fam === 'LA' && g.lav && r.widths.includes(g.lav)) pref = g.lav;
        if (!r.widths.includes(pref)) pref = r.widths.reduce((a, b) => (Math.abs(b - pref) < Math.abs(a - pref) ? b : a));
        items.push({ k: 'MOD', fam: r.fam, widths: r.widths, pref });
      }
    }
    const modIdx = items.map((it, ix) => (it.k === 'MOD' ? ix : -1)).filter((ix) => ix >= 0);
    const lists = modIdx.map((ix) => items[ix].widths.slice().sort((a: number, b: number) => Math.abs(a - items[ix].pref) - Math.abs(b - items[ix].pref)).slice(0, 4));
    const fixedRef = items.filter((it) => it.k === 'REF').reduce((a, it) => a + it.w, 0);
    const fills = items.filter((it) => it.k === 'FILL');
    const ptot = fills.reduce((a, it) => a + it.peso, 0);
    let best: any = null, minNeed = fixedRef;
    modIdx.forEach((ix) => { minNeed += Math.min(...items[ix].widths); });
    for (const cb of combos(lists, 600)) {
      const fixed = fixedRef + cb.reduce((a: number, w: number) => a + w, 0), free = usable - fixed;
      if (free < 0) continue;
      let segs: number[][] = [], rem = free, nmods = cb.length;
      if (fills.length) {
        let carry = 0, alloc = 0;
        fills.forEach((f, fi) => {
          const L = fi === fills.length - 1 ? free - alloc : Math.floor(((free * f.peso) / ptot) / 10) * 10;
          alloc += L;
          const r = fillDP(L + carry, st.cost); segs.push(r.ws); carry = L + carry - r.sum; nmods += r.ws.length;
        });
        rem = carry;
      }
      const dev = cb.reduce((a: number, w: number, k: number) => a + Math.abs(w - items[modIdx[k]].pref), 0) / 100;
      const score = (rem >= 10 ? 30 + rem / 10 : 0) + nmods * 10 + dev * 25;
      if (!best || score < best.score) best = { score, cb, segs, rem };
    }
    if (!best) return { error: `En el ${mu.nombre.toLowerCase()} no caben los módulos de la regla: se necesitan al menos ${fmtI(minNeed)} mm y hay ${fmtI(usable)} mm útiles.` };
    const slots: Slot[] = []; let mk = 0, fk = 0;
    for (const it of items) {
      if (it.k === 'REF') slots.push({ b: `REF-${it.w}`, a: null });
      else if (it.k === 'MOD') {
        const w = best.cb[mk++];
        slots.push({ b: `${it.fam}-${w}-${famVar(it.fam, v)}`, a: null });
        if (w !== it.pref) notas.push(`${mu.nombre}: ${FAM[it.fam].nombre} ${w > it.pref ? 'ensanchado' : 'angostado'} a ${w} mm (preferido ${it.pref} mm) para que el muro calce.`);
      } else best.segs[fk++].forEach((w: number) => slots.push({ b: codeFor(w), a: null }));
    }
    if (best.rem >= 10) { slots.push({ b: `RL-${best.rem}-${v}`, a: null }); notas.push(`${mu.nombre}: queda un relleno de ${best.rem} mm.`); }
    runs.push({ label: mu.nombre, length: usable, slots, wall: mu.pared });
  }
  if (g.aereos) runs.forEach((run) => run.slots.forEach((sl) => {
    const m = getItem(sl.b);
    if (m && ['BA', 'CA', 'LA'].includes(m.fam) && getItem(`AE-${m.W}-A70`)) sl.a = `AE-${m.W}-A70`;
  }));
  return { runs, variant: v, notas };
}

export function kitchenTotals(runs: Run[]) {
  let modulos = 0, ml = 0, mlAereo = 0, n = 0;
  runs.forEach((r) => r.slots.forEach((s) => {
    const b = getItem(s.b);
    if (b && (b as any).kind !== 'ref') { modulos += priceOf(b); n++; if (!isTall(b)) ml += b.W / 1000; }
    const a = getItem(s.a);
    if (a) { modulos += priceOf(a); n++; if (a.kind === 'aereo') mlAereo += a.W / 1000; }
  }));
  const cub = ml * 48000, zoc = ml * 5000, ins = ml * 28000;
  const sub = modulos + cub + zoc + ins;
  return { modulos, ml, mlAereo, n, sub, iva: sub * 0.19, total: sub * 1.19 };
}

export { fmt$ };
