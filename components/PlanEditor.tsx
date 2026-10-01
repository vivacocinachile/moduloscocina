'use client';
import { useRef, useState } from 'react';
import { Run, isTall } from '@/lib/rules';
import { roomFrom, planRects, openingSVG, planSym, textOn, dropTarget, insertIndex, Room, Rect } from '@/lib/plan';
import { dimH, dimV } from '@/lib/drawing';

const fmtI = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

export function PlanEditor({
  runs, room: roomProp, onChange, selected, onSelect, showAereos = true,
}: {
  runs: Run[];
  room?: Room;
  onChange: (runs: Run[]) => void;
  selected: { ri: number; si: number } | null;
  onSelect: (sel: { ri: number; si: number } | null) => void;
  showAereos?: boolean;
}) {
  const room = roomProp || roomFrom(runs);
  const rects = planRects(runs, room);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<{ ri: number; si: number; x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ wall: string; along: number } | null>(null);

  const T = 120;
  const fs = Math.max(40, Math.round(Math.max(room.lx, room.ly) / 55));
  const m = Math.round(fs * 3.4);
  const vw = room.lx + 2 * m, vh = room.ly + 2 * m + fs * 2.6;

  function onPointerDown(e: React.PointerEvent, ri: number, si: number) {
    e.stopPropagation();
    onSelect({ ri, si });
    const svg = svgRef.current; if (!svg) return;
    const p = svgPoint(svg, e.clientX, e.clientY); if (!p) return;
    setDrag({ ri, si, x: p.x, y: p.y });
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const svg = svgRef.current; if (!svg) return;
    const p = svgPoint(svg, e.clientX, e.clientY); if (!p) return;
    const tgt = dropTarget(room, runs, p);
    if (tgt) setGhost({ wall: tgt.wall, along: insertIndex(room, runs, tgt, { ri: drag.ri, si: drag.si }).pos });
    else setGhost(null);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!drag) return;
    const svg = svgRef.current;
    const p = svg ? svgPoint(svg, e.clientX, e.clientY) : null;
    const tgt = p ? dropTarget(room, runs, p) : null;
    if (tgt && tgt.ri >= 0) {
      const next = runs.map((r) => ({ ...r, slots: r.slots.slice() }));
      const [slot] = next[drag.ri].slots.splice(drag.si, 1);
      const at = insertIndex(room, next, tgt, drag.ri === tgt.ri ? { ri: drag.ri, si: drag.si } : undefined);
      next[tgt.ri].slots.splice(at.idx, 0, slot);
      onChange(next);
      onSelect({ ri: tgt.ri, si: at.idx });
    }
    setDrag(null); setGhost(null);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-m} ${-m} ${vw} ${vh}`}
      className="w-full h-auto select-none touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => { setDrag(null); setGhost(null); }}
      onClick={() => onSelect(null)}
    >
      <rect x={-T} y={-T} width={room.lx + 2 * T} height={room.ly + 2 * T} fill="#14232B" />
      <rect x={0} y={0} width={room.lx} height={room.ly} fill="white" />
      {room.ab.map((ab, i) => <g key={i} dangerouslySetInnerHTML={{ __html: openingSVG(ab, room) }} />)}

      {rects.map((rc) => {
        const ref = (rc.item as any).kind === 'ref';
        const tall = isTall(rc.item);
        const sel = selected && selected.ri === rc.ri && selected.si === rc.si;
        const beingDragged = drag && drag.ri === rc.ri && drag.si === rc.si;
        const fillHex = '#E6E6E1';
        const baseStyle: any = ref ? { fill: 'none', stroke: '#14232B' } : tall ? { fill: '#B7C3C6', stroke: '#14232B' } : {};
        return (
          <g
            key={`${rc.ri}-${rc.si}`}
            opacity={beingDragged ? 0.35 : 1}
            className="cursor-grab"
            onPointerDown={(e) => onPointerDown(e, rc.ri, rc.si)}
          >
            <rect
              x={rc.x} y={rc.y} width={rc.w} height={rc.h}
              style={!ref && !tall
                ? { fill: fillHex, stroke: sel ? '#0B5C6B' : '#14232B', strokeWidth: sel ? 3 : 1.4 }
                : { ...baseStyle, stroke: sel ? '#0B5C6B' : baseStyle.stroke, strokeWidth: sel ? 3 : 1.4 }}
              strokeDasharray={ref ? '10 7' : undefined}
            />
            {!ref && <g dangerouslySetInnerHTML={{ __html: planSym(rc) }} />}
            {Math.min(rc.w, rc.h) > fs * 1.6 && Math.max(rc.w, rc.h) > fs * 2.4 && (
              <>
                <text x={rc.x + rc.w / 2} y={rc.y + rc.h / 2} textAnchor="middle" fontWeight={600} fontSize={fs * 0.85} fill={ref ? '#14232B' : textOn(fillHex)}>
                  {ref ? 'Refrig.' : rc.item.fam + ' ' + rc.item.W / 10}
                </text>
                <text x={rc.x + rc.w / 2} y={rc.y + rc.h / 2 + fs * 0.95} textAnchor="middle" fontSize={fs * 0.7} fill={ref ? '#14232B' : textOn(fillHex)}>
                  {rc.item.W}
                </text>
              </>
            )}
          </g>
        );
      })}

      {showAereos && rects.map((rc) => {
        if (!rc.a) return null;
        const ad = 320, off = (rc.item.W - rc.a.W) / 2;
        let x = 0, y = 0, w = 0, h = 0;
        if (rc.wall === 'N') { x = rc.x + off; y = 0; w = rc.a.W; h = ad; }
        else if (rc.wall === 'S') { x = rc.x + off; y = room.ly - ad; w = rc.a.W; h = ad; }
        else if (rc.wall === 'O') { x = 0; y = rc.y + off; w = ad; h = rc.a.W; }
        else { x = room.lx - ad; y = rc.y + off; w = ad; h = rc.a.W; }
        return <rect key={`a-${rc.ri}-${rc.si}`} x={x} y={y} width={w} height={h} fill="none" stroke="#14232B" strokeDasharray="12 8" opacity={0.75} />;
      })}

      {ghost && (
        <g dangerouslySetInnerHTML={{
          __html: (() => {
            const w = ghost.wall as any;
            let a: number[];
            const D = 560;
            if (w === 'N') a = [ghost.along, 0, ghost.along, D];
            else if (w === 'S') a = [ghost.along, room.ly - D, ghost.along, room.ly];
            else if (w === 'O') a = [0, ghost.along, D, ghost.along];
            else a = [room.lx - D, ghost.along, room.lx, ghost.along];
            return `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" stroke="#0B5C6B" stroke-width="5" stroke-linecap="round"/>`;
          })(),
        }}
        />
      )}

      <g dangerouslySetInnerHTML={{ __html: dimH(0, room.lx, -fs * 2.4, fmtI(room.lx), fs) }} />
      <g dangerouslySetInnerHTML={{ __html: dimV(-fs * 2.4, 0, room.ly, fmtI(room.ly), fs) }} />
    </svg>
  );
}
