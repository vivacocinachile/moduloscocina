// Geometría de la planta — portada de modulos-vivacocina-supabase.html (roomDefaults,
// localToXY, planRects, openingSVG, planSym). Sin globales: recibe los runs y el room
// como parámetros en vez de leer K/CFG directamente.
import { CFG, Modulo } from './modules';
import { Run, getItem, isTall } from './rules';

export type Wall = 'N' | 'S' | 'O' | 'E';
export interface Room { lx: number; ly: number; ab: { t: 'puerta' | 'ventana'; p: Wall; u: number; a: number }[] }
export interface Rect { ri: number; si: number; x: number; y: number; w: number; h: number; wall: Wall; item: Modulo; a: Modulo | null }

export function runUsed(r: Run): number {
  let u = 0;
  r.slots.forEach((s) => { const b = getItem(s.b); if (b) u += b.W; });
  return u;
}

export function roomFrom(runs: Run[]): Room {
  const D = CFG.prof.base;
  let lx = 0, ly = 0, ns = 0, eo = 0;
  const ws: Wall[] = [];
  runs.forEach((r) => {
    const w = r.wall;
    ws.push(w);
    const u = Math.max(runUsed(r), r.length || 0);
    if (w === 'N' || w === 'S') { lx = Math.max(lx, u); ns++; } else { ly = Math.max(ly, u + D); eo++; }
  });
  if (!lx) lx = 2400 + (eo ? D : 0);
  if (!ly) ly = Math.max(2400, D + 1500);
  if (ns > 1) ly = Math.max(ly, 2 * D + 1200);
  if (eo > 1) lx = Math.max(lx, 2 * D + 1200);
  const free = (['S', 'E', 'O', 'N'] as Wall[]).find((p) => !ws.includes(p)) || 'S';
  let u = 300;
  if ((free === 'N' || free === 'S') && ws.includes('O')) u = D + 150;
  if ((free === 'E' || free === 'O') && ws.includes('N')) u = D + 150;
  return { lx: Math.round(lx), ly: Math.round(ly), ab: [{ t: 'puerta', p: free, u, a: 800 }] };
}

export function localToXY(w: Wall, u: number, v: number, room: Room): [number, number] {
  if (w === 'N') return [u, v];
  if (w === 'S') return [u, room.ly - v];
  if (w === 'O') return [v, u];
  return [room.lx - v, u];
}
// inversa: dado un punto (x,y) del plano y una pared, recupera (u,v) local a esa pared.
export function xyToLocal(w: Wall, x: number, y: number, room: Room): [number, number] {
  if (w === 'N') return [x, y];
  if (w === 'S') return [x, room.ly - y];
  if (w === 'O') return [y, x];
  return [y, room.lx - x];
}

export function planRects(runs: Run[], room: Room): Rect[] {
  const D = CFG.prof.base, out: Rect[] = [];
  const hasN = runs.some((r) => r.wall === 'N');
  runs.forEach((r, ri) => {
    const w = r.wall;
    let acc = r.off != null ? +r.off : (w === 'O' || w === 'E') && hasN ? D : 0;
    r.slots.forEach((sl, si) => {
      const b = getItem(sl.b); if (!b) return;
      const dep = (b as any).kind === 'ref' ? 700 : D, bw = b.W;
      let x = 0, y = 0, rw = 0, rh = 0;
      if (w === 'N') { x = acc; y = 0; rw = bw; rh = dep; }
      else if (w === 'S') { x = acc; y = room.ly - dep; rw = bw; rh = dep; }
      else if (w === 'O') { x = 0; y = acc; rw = dep; rh = bw; }
      else { x = room.lx - dep; y = acc; rw = dep; rh = bw; }
      out.push({ ri, si, x, y, w: rw, h: rh, wall: w, item: b, a: getItem(sl.a) });
      acc += bw;
    });
  });
  return out;
}

export function textOn(hex?: string): string {
  const h = String(hex || '#ffffff').replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16) || 0, g = parseInt(n.slice(2, 4), 16) || 0, b = parseInt(n.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#14232B' : '#F4F7F8';
}

export function openingSVG(ab: Room['ab'][number], room: Room): string {
  const w = ab.p, u = +ab.u, a = +ab.a, T = 120;
  const P = (uu: number, vv: number) => localToXY(w, uu, vv, room);
  const c1 = P(u, -T), c2 = P(u + a, 0);
  const x = Math.min(c1[0], c2[0]), y = Math.min(c1[1], c2[1]), cw = Math.abs(c1[0] - c2[0]), ch = Math.abs(c1[1] - c2[1]);
  let s = `<rect class="pl-floor" x="${x}" y="${y}" width="${cw}" height="${ch}"/>`;
  if (ab.t === 'ventana') {
    [0.3, 0.7].forEach((f) => { const p1 = P(u, -T * f), p2 = P(u + a, -T * f); s += `<line class="pl-win" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`; });
    const q1 = P(u, -T), q2 = P(u, 0), q3 = P(u + a, -T), q4 = P(u + a, 0);
    s += `<line class="pl-win" x1="${q1[0]}" y1="${q1[1]}" x2="${q2[0]}" y2="${q2[1]}"/><line class="pl-win" x1="${q3[0]}" y1="${q3[1]}" x2="${q4[0]}" y2="${q4[1]}"/>`;
  } else {
    const h = P(u, 0), e = P(u, a), f = P(u + a, 0), sweep = w === 'S' || w === 'O' ? 0 : 1;
    s += `<line class="pl-door" x1="${h[0]}" y1="${h[1]}" x2="${e[0]}" y2="${e[1]}"/><path class="pl-door" d="M${f[0]} ${f[1]} A${a} ${a} 0 0 ${sweep} ${e[0]} ${e[1]}"/>`;
  }
  return s;
}

export function planSym(rc: Rect): string {
  const it = rc.item, horiz = rc.wall === 'N' || rc.wall === 'S';
  const cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2, along = horiz ? rc.w : rc.h, across = horiz ? rc.h : rc.w;
  if (it.fam === 'LA') {
    const a = along * 0.62, b = across * 0.5, w = horiz ? a : b, h = horiz ? b : a;
    return `<rect class="pl-sym" rx="30" x="${+(cx - w / 2).toFixed(1)}" y="${+(cy - h / 2).toFixed(1)}" width="${+w.toFixed(1)}" height="${+h.toFixed(1)}"/>`;
  }
  if (it.fam === 'CO') {
    const dx = along * 0.22, dy = across * 0.2, r = Math.min(along, across) * 0.11;
    let s = '';
    for (const i of [-1, 1]) for (const j of [-1, 1]) {
      const px = horiz ? cx + i * dx : cx + j * dy, py = horiz ? cy + j * dy : cy + i * dx;
      s += `<circle class="pl-sym" cx="${+px.toFixed(1)}" cy="${+py.toFixed(1)}" r="${+r.toFixed(1)}"/>`;
    }
    return s;
  }
  return '';
}

// --- destino de arrastre: a qué pared cae un punto del plano, y en qué índice del muro ---
export function dropTarget(room: Room, runs: Run[], pt: { x: number; y: number }) {
  const dist = { N: pt.y, S: room.ly - pt.y, O: pt.x, E: room.lx - pt.x } as Record<Wall, number>;
  let w: Wall = 'N', best = Infinity;
  (['N', 'S', 'O', 'E'] as Wall[]).forEach((k) => { if (dist[k] < best) { best = dist[k]; w = k; } });
  if (best > 900 || pt.x < -700 || pt.y < -700 || pt.x > room.lx + 700 || pt.y > room.ly + 700) return null;
  const along = w === 'N' || w === 'S' ? pt.x : pt.y;
  const ri = runs.findIndex((r) => r.wall === w);
  return { wall: w, ri, along };
}
export function insertIndex(room: Room, runs: Run[], target: { wall: Wall; ri: number; along: number }, skip?: { ri: number; si: number }) {
  if (target.ri < 0) return { idx: 0, pos: 0 };
  const hasN = runs.some((r) => r.wall === 'N');
  const D = CFG.prof.base;
  const r = runs[target.ri];
  let acc = r.off != null ? +r.off : (target.wall === 'O' || target.wall === 'E') && hasN ? D : 0;
  let idx = 0;
  for (let i = 0; i < r.slots.length; i++) {
    if (skip && skip.ri === target.ri && skip.si === i) continue;
    const b = getItem(r.slots[i].b); const bw = b ? b.W : 0;
    if (target.along < acc + bw / 2) return { idx, pos: acc };
    acc += bw; idx++;
  }
  return { idx, pos: acc };
}
