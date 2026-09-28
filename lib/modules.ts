// Motor de cálculo de módulos de VivaCocina — portado desde modulos-vivacocina-supabase.html
// Etapa 1: cubre los módulos de fábrica (bajos, cajoneros, lavaplatos, cocción, horno,
// aéreos y torres). Los módulos propios (Diseñar módulos) y el catálogo de materiales
// llegan en una etapa siguiente; por ahora los tableros y herrajes usan precios fijos (PR).

export interface Part {
  n: string; q: number; l: number; w: number;
  mat: 'C' | 'F' | 'B'; eL: number; eA: number; note?: string;
}
export interface FrontEl {
  k: 'door' | 'drawer' | 'panel' | 'niche';
  x: number; y: number; w: number; h: number;
  hinge?: 'L' | 'R' | 'T' | 'S'; label?: string;
}
export interface Modulo {
  code: string; fam: string; kind: 'base' | 'aereo' | 'torre'; v: string;
  W: number; H: number; D: number; Hc: number; zoc: number;
  name: string; config: string;
  parts: Part[]; herr: Record<string, number>; front: FrontEl[];
  shelfY: number[]; notes: string[]; noBack: boolean; pieces: number;
  slideLen?: number; railOri?: string;
}

const fmtI = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const CFG: any = {t:18,tf:3,zoc:100,gap:3,rail:80,slide:13,setback:10,railOri:'horizontal',bases:[700,800],openSym:'manilla',seeded:[],mecOverrides:{},mec:{front:37,back:37,shelfMargin:64,bisagraEdge:100,bisagraOffset:22,tiradorCentro:128,confirmatOffset:9,pinD:5,camD:8,cupD:35,cupDepth:12.5,confirmatD:8,pilotD:3},prof:{base:560,aereo:320,torre:560}};
export const PR: any = {
  plancha:{C:{precio:42000,l:2440,w:1830},F:{precio:52000,l:2440,w:1830},B:{precio:9500,l:2440,w:1830}},
  merma:0.12,
  canto:{merma:0.08,precio:190},
  herr:{
    bisagra:{n:'Bisagra cazoleta 35 mm',p:1900},
    corredera:{n:'Corredera cajón 500 mm (par)',p:7500},
    tirador:{n:'Tirador',p:2600},
    pata:{n:'Pata regulable',p:700},
    soporte:{n:'Soporte de estante',p:60},
    colgador:{n:'Colgador de aéreo (par)',p:5200},
    escuadra:{n:'Escuadra de fijación',p:1500},
    abatible:{n:'Herraje abatible (juego)',p:18000},
    rielpuerta:{n:'Kit riel de puerta corredera',p:14000},
    kit:{n:'Kit de tornillería y uniones',p:3500}
  },
  mo:{minPieza:4,minHerraje:2,valorHora:6500},
  margen:0.35,
  iva:0.19,
  extras:{cubierta:48000,zocalo:5000,instalacion:28000}
};
export const KIND: Record<string, 'base' | 'aereo' | 'torre'> = {BA:'base',CA:'base',LA:'base',CO:'base',HO:'base',AE:'aereo',TD:'torre',TH:'torre'};

export const FAM: Record<string, { nombre: string; widths: number[]; vars: string[] }> = {
  BA:{nombre:'Bajo',widths:[300,400,450,500,600,800,900],vars:['H70','H80']},
  CA:{nombre:'Cajonero',widths:[400,450,600,800,900],vars:['H70','H80']},
  LA:{nombre:'Lavaplatos',widths:[600,800,900],vars:['H70','H80']},
  CO:{nombre:'Cocción',widths:[600,800],vars:['H70','H80']},
  HO:{nombre:'Horno',widths:[600],vars:['H80']},
  AE:{nombre:'Aéreo',widths:[300,400,450,500,600,800,900],vars:['A70','A90']},
  TD:{nombre:'Torre despensa',widths:[450,600],vars:['T210']},
  TH:{nombre:'Torre horno',widths:[600],vars:['T210']}
};

export const VAR_H: Record<string, number> = {H70:700,H80:800,A70:700,A90:900,T180:1800,T210:2100,T240:2400};
const hKey=(h:number)=>'H'+Math.round(h/10);

const hingesFor=(h:number)=>h<=900?2:h<=1500?3:h<=2000?4:5;
const legsFor=(W:number,kind:string)=>kind==='torre'?6:(W<=800?4:6);

const fmtN = (n: number, d = 2) => Number(n).toFixed(d).replace('.', ',');
const plural = (n: number, s: string, p: string) => n + ' ' + (n === 1 ? s : p);

// Corredera de referencia fija (etapa 1, sin catálogo de herrajes todavía)
function slideSpec(D: number) {
  const need = Math.floor((D - 50) / 50) * 50;
  return { need, nominal: need, holg: CFG.slide, dL: 0, altoMax: 180, dT: 0, linea: 'Telescópica' };
}
function drawerBoxParts(add: any, W: number, t: number, fh: number, idx: number, sp: any) {
  const boxW = W - 2 * t - 2 * sp.holg, boxLen = sp.nominal - sp.dL;
  const bh = Math.max(70, Math.min(sp.altoMax, fh - 70));
  add('Costado cajón ' + idx, 2, boxLen, bh, 'C', 1, 0, 'Corredera ' + sp.linea + ' ' + sp.nominal + ' mm');
  add('Frente de caja ' + idx, 1, boxW - 2 * t, bh, 'C', 1, 0);
  add('Trasera de caja ' + idx, 1, boxW - 2 * t, bh - sp.dT, 'C', 1, 0);
  add('Fondo caja ' + idx, 1, boxW - 4, boxLen - 4, 'B', 0, 0, 'HDF 3 mm');
}
function applyRailOri(parts: Part[], ori: string) {
  parts.forEach((p) => {
    if (/^Travesaño/.test(p.n)) {
      p.note = (p.note ? p.note + ' · ' : '') + (ori === 'vertical' ? 'De canto (vertical)' : 'Plano (horizontal)');
      if (ori === 'vertical') p.eL = 0;
    }
  });
}

export function buildModule(fam: string, W: number, v: string): Modulo | null {
  const kind=KIND[fam],H=VAR_H[v],t=CFG.t,g=CFG.gap,D=CFG.prof[kind];
  const legs=kind!=='aereo',zoc=legs?CFG.zoc:0,Hc=H-zoc;
  const parts:Part[]=[],herr:Record<string,number>={},front:FrontEl[]=[],shelfY:number[]=[],notes:string[]=[];
  let config='',noBack=false;
  const add=(n:string,q:number,l:number,w:number,mat:'C'|'F'|'B',eL?:number,eA?:number,note?:string)=>parts.push({n,q,l:Math.round(l),w:Math.round(w),mat,eL:eL||0,eA:eA||0,note:note||''});
  const hw=(k:string,q:number)=>{if(q>0)herr[k]=(herr[k]||0)+q;};
  const nD=W<=500?1:2;
  const doorsRow=(n:number,yb:number,hTot:number,label:string)=>{
    const dw=(W-g*(n+1))/n,dh=hTot-g;
    for(let i=0;i<n;i++)front.push({k:'door',x:g+i*(dw+g),y:yb+g/2,w:dw,h:dh,hinge:n===1?'L':(i===0?'L':'R')});
    add(label,n,dh,dw,'F',2,2,'Frente');
    hw('bisagra',n*hingesFor(dh));hw('tirador',n);
  };
  const spec=slideSpec(D),slideLen=spec.need;
  const drawers=(fhs:number[],yStart:number)=>{
    let y=yStart;
    fhs.forEach((fh:number,i:number)=>{
      front.push({k:'drawer',x:g,y:y,w:W-2*g,h:fh});
      add('Frente cajón '+(i+1),1,W-2*g,fh,'F',2,2,'Frente');
      drawerBoxParts(add,W,t,fh,i+1,spec);
      y+=fh+g;
    });
    hw('corredera',fhs.length);hw('tirador',fhs.length);
  };
  const baseCarcass=(rear:boolean)=>{
    add('Lateral',2,Hc,D,'C',1,0,'Canto al frente');
    add('Piso',1,W-2*t,D-CFG.setback,'C',1,0);
    add('Travesaño delantero',1,W-2*t,CFG.rail,'C',1,0);
    if(rear)add('Travesaño trasero',1,W-2*t,CFG.rail,'C',0,0);
  };
  switch(fam){
    case 'BA':{
      baseCarcass(true);
      add('Estante',1,W-2*t-2,D-50,'C',1,0,'Regulable');shelfY.push(zoc+Math.round(Hc/2));hw('soporte',4);
      add('Fondo',1,W-4,Hc-4,'B',0,0,'HDF 3 mm');
      doorsRow(nD,zoc,Hc,'Puerta');
      config=plural(nD,'puerta','puertas')+' · 1 estante';break;}
    case 'CA':{
      baseCarcass(true);
      add('Fondo',1,W-4,Hc-4,'B',0,0,'HDF 3 mm');
      const av=Hc-g*4,h1=Math.round(av*.27),h2=Math.round(av*.33),h3=av-h1-h2;
      drawers([h3,h2,h1],zoc+g/2);
      config='3 cajones';break;}
    case 'LA':{
      add('Lateral',2,Hc,D,'C',1,0,'Canto al frente');
      add('Piso',1,W-2*t,D-CFG.setback,'C',1,0,'Recorte para sifón en obra');
      add('Travesaño delantero',1,W-2*t,CFG.rail,'C',1,0);
      add('Travesaño trasero',1,W-2*t,CFG.rail,'C',0,0);
      add('Fondo',1,W-4,Hc-4,'B',0,0,'Recortar para instalaciones');
      doorsRow(nD,zoc,Hc,'Puerta');
      config=plural(nD,'puerta','puertas')+' · sin estante';
      notes.push('Requiere agua y desagüe. Sin estante para dejar libre el sifón.');break;}
    case 'CO':{
      baseCarcass(true);
      add('Fondo',1,W-4,Hc-4,'B',0,0,'Recortar para gas o electricidad');
      const av=Hc-g*3,top=Math.round(av*.4),bot=av-top;
      drawers([bot,top],zoc+g/2);
      config='2 cajones · bajo encimera';
      notes.push('Bajo encimera de cocción. Dejar paso para conexión de gas o eléctrica.');break;}
    case 'HO':{
      const nicho=595,railH=Hc-t-nicho;
      if(railH<40||W-2*t<560)return null;
      add('Lateral',2,Hc,D,'C',1,0,'Canto al frente');
      add('Piso',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Frontal sobre horno',1,W-2*t,railH,'C',1,0);
      front.push({k:'niche',x:t,y:zoc+t,w:W-2*t,h:nicho,label:'Horno'});
      front.push({k:'panel',x:t,y:zoc+t+nicho,w:W-2*t,h:railH});
      noBack=true;
      config='Nicho de horno '+nicho+' mm · sin puertas';
      notes.push('Sin fondo para ventilación y conexión eléctrica. Nicho interior '+(W-2*t)+' × '+nicho+' mm.');break;}
    case 'AE':{
      add('Lateral',2,H,D,'C',1,0,'Canto al frente');
      add('Techo y piso',2,W-2*t,D-CFG.setback,'C',1,0);
      const ns=H>=900?2:1;
      add('Estante',ns,W-2*t-2,D-30,'C',1,0,'Regulable');hw('soporte',4*ns);
      for(let i=1;i<=ns;i++)shelfY.push(Math.round(H*i/(ns+1)));
      add('Fondo',1,W-4,H-4,'B',0,0,'HDF 3 mm');
      hw('colgador',1);
      doorsRow(nD,0,H,'Puerta');
      config=plural(nD,'puerta','puertas')+' · '+plural(ns,'estante','estantes');break;}
    case 'TD':{
      add('Lateral',2,Hc,D,'C',1,0,'Canto al frente');
      add('Piso',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Divisor intermedio',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Techo',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Estante',4,W-2*t-2,D-50,'C',1,0,'Regulable');hw('soporte',16);
      const sec=Math.round(Hc/2);
      [sec/3,sec*2/3,sec,sec+sec/3,sec+sec*2/3].forEach(y=>shelfY.push(zoc+Math.round(y)));
      add('Fondo',1,W-4,Hc-4,'B',0,0,'HDF 3 mm');
      doorsRow(nD,zoc,sec,'Puerta inferior');
      doorsRow(nD,zoc+sec,Hc-sec,'Puerta superior');
      hw('escuadra',2);
      config='2 secciones · '+plural(nD*2,'puerta','puertas')+' · 4 estantes';break;}
    case 'TH':{
      const Z1=250,nicho=595,upper=Hc-4*t-Z1-nicho;
      if(W-2*t<560)return null;
      add('Lateral',2,Hc,D,'C',1,0,'Canto al frente');
      add('Piso',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Divisor bajo horno',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Divisor sobre horno',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Techo',1,W-2*t,D-CFG.setback,'C',1,0);
      add('Estante',2,W-2*t-2,D-50,'C',1,0,'Regulable');hw('soporte',8);
      add('Fondo cajón',1,W-4,Z1+t,'B',0,0,'HDF 3 mm');
      add('Fondo superior',1,W-4,upper+2*t,'B',0,0,'HDF 3 mm');
      const y1=zoc+t;
      drawers([Z1-g],y1+g/2-g/2);
      const yn=y1+Z1+t;
      front.push({k:'niche',x:t,y:yn,w:W-2*t,h:nicho,label:'Horno'});
      const yu=yn+nicho+t;
      doorsRow(nD,yn+nicho,H-(yn+nicho),'Puerta superior');
      shelfY.push(yu+Math.round(upper/3),yu+Math.round(upper*2/3));
      shelfY.push(y1+Z1,yn+nicho);
      hw('escuadra',2);
      noBack=false;
      config='Cajón · nicho de horno '+nicho+' mm · '+plural(nD,'puerta','puertas');
      notes.push('Nicho interior '+(W-2*t)+' × '+nicho+' mm, sin fondo detrás del horno.');break;}
    default:return null;
  }
  hw('pata',legs?legsFor(W,kind):0);
  addTornilleria(hw,parts,herr);
  const cm=W/10;
  const name=FAM[fam].nombre+' '+(Number.isInteger(cm)?cm:fmtN(cm,1));
  let pieces=0;parts.forEach(p=>pieces+=p.q);
  const ori=CFG.railOri||'horizontal';applyRailOri(parts,ori);
  return {code:fam+'-'+W+'-'+v,fam,kind,v,W,H,D,Hc,zoc,name,config,parts,herr,front,shelfY,notes,noBack,pieces,slideLen:(fam==='CA'||fam==='CO'||fam==='TH')?slideLen:0,railOri:ori};
}

export function buildFiller(w: number, v: string): Modulo {
  const H=VAR_H[v],zoc=CFG.zoc,Hc=H-zoc,g=CFG.gap;
  const parts:Part[]=[{n:'Panel de relleno',q:1,l:Hc-g,w:Math.max(w-g,10),mat:'F',eL:2,eA:2,note:'Frente'}];
  return {code:'RL-'+w+'-'+v,fam:'RL',kind:'base' as const,v,W:w,H,D:CFG.prof.base,Hc,zoc,name:'Relleno '+fmtI(w)+' mm',config:'Panel de relleno',
    parts,herr:{},front:[{k:'panel' as const,x:0,y:zoc,w,h:Hc}],shelfY:[],notes:[],noBack:true,pieces:1};
}

// ==== costo (versión etapa 1: precios fijos de PR, sin catálogo de materiales) ====
export function sumH(herr: Record<string, number>, prefix: string): number {
  let s = 0;
  for (const k in herr) if (k === prefix || k.indexOf(prefix + ':') === 0) s += herr[k];
  return s;
}

export function addTornilleria(hw: (k: string, q: number) => void, parts: Part[], herr: Record<string, number>) {
  const fixedRe = /^(Piso|Techo|Travesaño|Divisor|Frontal sobre horno)/;
  let uniones = 0;
  parts.forEach((p) => { if (fixedRe.test(p.n)) uniones += p.q * 2; });
  hw('confirmat', uniones);
  hw('tarugo', uniones);
  hw('tornbis', sumH(herr, 'bisagra') * 4);
  hw('torncor', sumH(herr, 'corredera') * 8);
  let clavo = 0;
  parts.forEach((p) => { if (p.mat === 'B') clavo += p.q * Math.ceil((2 * (p.l + p.w)) / 100); });
  hw('clavofondo', clavo);
  hw('tornpata', (herr.pata || 0) * 2);
  hw('torntir', sumH(herr, 'tirador') * 2);
  hw('insumos', 1);
}
// Nota: hoy buildModule ya llama a addTornilleria por su cuenta (portado tal cual del original),
// así que M.herr llega con el desglose de tornillería incluido — no hay que volver a calcularlo aquí.

const HERR_LABEL: Record<string, string> = {
  confirmat: 'Tornillo confirmat', tarugo: 'Tarugo', tornbis: 'Tornillo de bisagra',
  torncor: 'Tornillo de corredera', clavofondo: 'Grapa o clavo de fondo',
  tornpata: 'Tornillo de pata', torntir: 'Tornillo de tirador', insumos: 'Insumos varios',
};
function herrName(k: string): string {
  return (PR.herr as any)[k]?.n || HERR_LABEL[k] || k;
}
function herrPrice(k: string): number {
  return (PR.herr as any)[k]?.p ?? { confirmat: 180, tarugo: 40, tornbis: 60, torncor: 50, clavofondo: 15, tornpata: 50, torntir: 60, insumos: 1200 }[k] ?? 0;
}

export interface Costo {
  materiales: number; tapacanto: number; herrajes: number; mo: number;
  costo: number; precio: number; pcs: number; canto: number;
  herrLines: { k: string; nombre: string; q: number; precio: number }[];
}

export function costModule(M: Modulo): Costo {
  const A: any = { C: 0, F: 0, B: 0 };
  let canto = 0, pcs = 0;
  for (const p of M.parts) {
    A[p.mat] += (p.q * p.l * p.w) / 1e6;
    canto += (p.q * (p.eL * p.l + p.eA * p.w)) / 1000;
    pcs += p.q;
  }
  const pm2 = (k: 'C' | 'F' | 'B') => PR.plancha[k].precio / ((PR.plancha[k].l * PR.plancha[k].w) / 1e6);
  const materiales = (A.C * pm2('C') + A.F * pm2('F') + A.B * pm2('B')) * (1 + PR.merma);
  const cantoM = canto * (1 + PR.canto.merma);
  const tapacanto = cantoM * PR.canto.precio;
  let herrajes = 0, hn = 0;
  const lines: Costo['herrLines'] = [];
  for (const k in M.herr) {
    const q = M.herr[k];
    if (!q) continue;
    const precio = herrPrice(k);
    herrajes += q * precio;
    if (!['pata', 'soporte', 'confirmat', 'tarugo', 'tornbis', 'torncor', 'clavofondo', 'tornpata', 'torntir', 'insumos'].includes(k)) hn += q;
    lines.push({ k, nombre: herrName(k), q, precio });
  }
  const mo = ((pcs * PR.mo.minPieza + hn * PR.mo.minHerraje) / 60) * PR.mo.valorHora;
  const costo = materiales + tapacanto + herrajes + mo;
  return { materiales, tapacanto, herrajes, mo, costo, precio: costo * (1 + PR.margen), pcs, canto, herrLines: lines };
}

export const fmt$ = (n: number) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ==== biblioteca completa: todas las combinaciones fam × ancho × altura ====
export function buildLibrary(): Modulo[] {
  const mods: Modulo[] = [];
  for (const fam of Object.keys(FAM)) {
    for (const v of FAM[fam].vars) {
      for (const W of FAM[fam].widths) {
        const m = buildModule(fam, W, v);
        if (m) mods.push(m);
      }
    }
  }
  return mods;
}
