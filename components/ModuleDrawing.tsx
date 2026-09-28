'use client';
import { Modulo } from '@/lib/modules';
import { frontSVG, sideSVG } from '@/lib/drawing';

// dangerouslySetInnerHTML es intencional aquí: el SVG viene de una función pura
// (frontSVG/sideSVG) que arma el marcado a partir de las medidas del módulo, no de
// texto libre del usuario. Pendiente para una etapa de pulido: reescribirlo como
// JSX (<rect>/<line>/<text>) en vez de strings.
export function ModuleFront({ m, h }: { m: Modulo; h?: number }) {
  return <div dangerouslySetInnerHTML={{ __html: frontSVG(m, { h }) }} />;
}
export function ModuleSide({ m, h }: { m: Modulo; h?: number }) {
  return <div dangerouslySetInnerHTML={{ __html: sideSVG(m, { h }) }} />;
}
