// Dibujo de elevación frontal y corte lateral de un módulo.
// Etapa 1: sigue generando un string SVG (igual que el HTML original) en vez de
// primitivas JSX puras — más rápido de portar hoy; conviene reescribirlo a JSX
// (<rect>/<line>/<text> de React) en una etapa de pulido, para sacarnos de encima
// el dangerouslySetInnerHTML.
import { CFG, Modulo, FrontEl } from './modules';

const fmtI = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function dimH(x1: number, x2: number, y: number, label: string, fs: number) {
  const mx = (x1 + x2) / 2;
  return `<g class="dr-dim"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - fs * 0.35}" x2="${x1}" y2="${y + fs * 0.35}"/><line x1="${x2}" y1="${y - fs * 0.35}" x2="${x2}" y2="${y + fs * 0.35}"/><text x="${mx}" y="${y + fs * 1.15}" text-anchor="middle" font-size="${fs}">${label}</text></g>`;
}
function dimV(x: number, y1: number, y2: number, label: string, fs: number) {
  const my = (y1 + y2) / 2;
  return `<g class="dr-dim"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - fs * 0.35}" y1="${y1}" x2="${x + fs * 0.35}" y2="${y1}"/><line x1="${x - fs * 0.35}" y1="${y2}" x2="${x + fs * 0.35}" y2="${y2}"/><text transform="translate(${x - fs * 0.45},${my}) rotate(-90)" text-anchor="middle" font-size="${fs}">${label}</text></g>`;
}

function drawFronts(M: Modulo, ox: number, yOff: number, yTop: number, detail: boolean) {
  const X = (x: number) => +(ox + x).toFixed(1);
  const Yt = (y: number, h: number) => +(yTop - (yOff + y + h)).toFixed(1);
  const Yp = (y: number) => +(yTop - (yOff + y)).toFixed(1);
  let s = '';
  if (M.zoc > 0) s += `<rect class="dr-zoc" x="${X(0)}" y="${Yt(0, M.zoc)}" width="${M.W}" height="${M.zoc}"/>`;
  s += `<rect class="dr-body" x="${X(0)}" y="${Yt(M.zoc, M.H - M.zoc)}" width="${M.W}" height="${M.H - M.zoc}"/>`;
  for (const e of M.front) {
    const x = X(e.x), y = Yt(e.y, e.h), w = +e.w.toFixed(1), h = +e.h.toFixed(1);
    if (e.k === 'niche') {
      s += `<rect class="dr-niche" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
      s += `<text class="dr-nt" x="${+(x + w / 2).toFixed(1)}" y="${+(y + h / 2).toFixed(1)}" text-anchor="middle" font-size="${Math.min(40, Math.round(w / 7))}">${e.label ?? ''}</text>`;
      continue;
    }
    s += `<rect class="dr-door" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    if (e.k === 'door' && e.hinge === 'T') {
      const cx = e.x + e.w / 2, hl = Math.min(90, e.w * 0.2), yy = Yp(e.y + 40);
      s += `<line class="dr-h" x1="${X(cx - hl)}" x2="${X(cx + hl)}" y1="${yy}" y2="${yy}"/>`;
      if (detail) {
        const mh = (CFG.openSym || 'manilla') === 'manilla';
        s += mh
          ? `<path class="dr-open" d="M${X(e.x)} ${Yp(e.y + e.h)} L${X(cx)} ${Yp(e.y)} L${X(e.x + e.w)} ${Yp(e.y + e.h)}"/>`
          : `<path class="dr-open" d="M${X(e.x)} ${Yp(e.y)} L${X(cx)} ${Yp(e.y + e.h)} L${X(e.x + e.w)} ${Yp(e.y)}"/>`;
      }
    } else if (e.k === 'door' && e.hinge === 'S') {
      const hxs = e.x < M.W / 2 ? e.x + e.w - 30 : e.x + 30, hl = Math.min(150, e.h * 0.25), y1 = e.y + e.h - 40;
      s += `<line class="dr-h" x1="${X(hxs)}" x2="${X(hxs)}" y1="${Yp(y1)}" y2="${Yp(y1 - hl)}"/>`;
      if (detail) {
        const my = Yp(e.y + e.h / 2), dir = e.x < M.W / 2 ? 1 : -1;
        const xa = X(dir > 0 ? e.x + e.w * 0.3 : e.x + e.w * 0.7), xb = X(dir > 0 ? e.x + e.w * 0.7 : e.x + e.w * 0.3);
        s += `<path class="dr-open" d="M${xa} ${my} L${xb} ${my} M${xb - dir * 28} ${my - 20} L${xb} ${my} L${xb - dir * 28} ${my + 20}"/>`;
      }
    } else if (e.k === 'door') {
      const hx = e.hinge === 'L' ? e.x + e.w - 30 : e.x + 30, hl = Math.min(150, e.h * 0.25);
      const y1 = M.kind === 'aereo' ? e.y + 40 : e.y + e.h - 40, y2 = M.kind === 'aereo' ? y1 + hl : y1 - hl;
      s += `<line class="dr-h" x1="${X(hx)}" x2="${X(hx)}" y1="${Yp(y1)}" y2="${Yp(y2)}"/>`;
      if (detail) {
        const hx2 = e.hinge === 'L' ? e.x : e.x + e.w, ox2 = e.hinge === 'L' ? e.x + e.w : e.x;
        const mh = (CFG.openSym || 'manilla') === 'manilla', ap = mh ? ox2 : hx2, bs = mh ? hx2 : ox2;
        s += `<path class="dr-open" d="M${X(bs)} ${Yp(e.y)} L${X(ap)} ${Yp(e.y + e.h / 2)} L${X(bs)} ${Yp(e.y + e.h)}"/>`;
      }
    } else if (e.k === 'drawer') {
      const cx = e.x + e.w / 2, hl = Math.min(90, e.w * 0.2), yy = Yp(e.y + e.h - 32);
      s += `<line class="dr-h" x1="${X(cx - hl)}" x2="${X(cx + hl)}" y1="${yy}" y2="${yy}"/>`;
    }
  }
  return s;
}

export function frontSVG(M: Modulo, o: { dims?: boolean; h?: number } = {}) {
  const dims = o.dims !== false, W = M.W, H = M.H;
  const fs = Math.max(18, Math.min(70, Math.round(Math.max(W, H) / 26)));
  const m = dims ? { l: fs * 2.6, r: fs * 0.8, t: fs * 0.8, b: fs * 2.8 } : { l: 8, r: 8, t: 8, b: 8 };
  let s = `<svg class="dr" viewBox="${-m.l} ${-m.t} ${W + m.l + m.r} ${H + m.t + m.b}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elevación frontal ${M.code}"${o.h ? ` style="height:${o.h}px;width:auto"` : ''}>`;
  s += drawFronts(M, 0, 0, H, dims);
  if (dims) { s += dimH(0, W, H + fs * 1.1, fmtI(W), fs); s += dimV(-fs * 1.2, 0, H, fmtI(H), fs); }
  return s + '</svg>';
}

export function sideSVG(M: Modulo, o: { h?: number } = {}) {
  const D = M.D, H = M.H, t = CFG.t, tf = CFG.t, tb = CFG.tf, g = CFG.gap;
  const fs = Math.max(18, Math.min(70, Math.round(Math.max(D, H) / 26)));
  const m = { l: fs * 2.6, r: fs * 0.8, t: fs * 0.8, b: fs * 2.8 };
  const Y = (y: number, h: number) => +(H - (y + h)).toFixed(1);
  let s = `<svg class="dr" viewBox="${-m.l - tf} ${-m.t} ${D + tf + m.l + m.r} ${H + m.t + m.b}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Corte lateral ${M.code}"${o.h ? ` style="height:${o.h}px;width:auto"` : ''}>`;
  if (M.zoc > 0) s += `<rect class="dr-zoc" x="60" y="${Y(0, M.zoc)}" width="${D - 80}" height="${M.zoc}"/>`;
  s += `<rect class="dr-body-line" x="0" y="${Y(M.zoc, M.H - M.zoc)}" width="${D}" height="${M.H - M.zoc}"/>`;
  if (M.kind === 'base' && M.fam !== 'HO') {
    s += `<rect class="dr-pan" x="0" y="${Y(M.zoc, t)}" width="${D - CFG.setback}" height="${t}"/>`;
    s += `<rect class="dr-pan" x="0" y="${Y(H - t, t)}" width="${CFG.rail}" height="${t}"/>`;
    s += `<rect class="dr-pan" x="${D - CFG.rail}" y="${Y(H - t, t)}" width="${CFG.rail - CFG.setback}" height="${t}"/>`;
  } else if (M.fam === 'HO') {
    s += `<rect class="dr-pan" x="0" y="${Y(M.zoc, t)}" width="${D - CFG.setback}" height="${t}"/>`;
    s += `<rect class="dr-pan" x="0" y="${Y(H - (M.Hc - t - 595), M.Hc - t - 595)}" width="${t}" height="${M.Hc - t - 595}"/>`;
  } else {
    s += `<rect class="dr-pan" x="0" y="${Y(M.zoc, t)}" width="${D - CFG.setback}" height="${t}"/>`;
    s += `<rect class="dr-pan" x="0" y="${Y(H - t, t)}" width="${D - CFG.setback}" height="${t}"/>`;
  }
  M.shelfY.forEach((sy) => { s += `<rect class="dr-pan" x="20" y="${Y(sy, t)}" width="${D - 50}" height="${t}"/>`; });
  if (!M.noBack) s += `<rect class="dr-pan" x="${D - tb}" y="${Y(M.zoc, M.H - M.zoc)}" width="${tb}" height="${M.H - M.zoc}"/>`;
  if (M.front.some((e) => e.k === 'door' || e.k === 'drawer')) s += `<rect class="dr-door" x="${-tf}" y="${Y(M.zoc + g / 2, M.H - M.zoc - g)}" width="${tf}" height="${M.H - M.zoc - g}"/>`;
  s += dimH(0, D, H + fs * 1.1, fmtI(D), fs);
  s += dimV(-tf - fs * 1.2, 0, H, fmtI(H), fs);
  return s + '</svg>';
}
