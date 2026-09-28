# Módulos VivaCocina — versión Next.js (etapa 1)

Primera etapa de la migración desde el archivo HTML único a Next.js 14 + Supabase + Vercel,
igual que Arrendia.

## Qué incluye esta etapa
- El motor de cálculo (`lib/modules.ts`): construye todos los módulos de fábrica
  (bajos, cajoneros, lavaplatos, cocción, horno, aéreos y torres) con su despiece,
  herrajes y costo — portado del HTML original.
- El catálogo completo navegable (`/catalogo`): buscador, agrupado por familia,
  ficha de cada módulo con dibujo frontal, corte lateral, despiece, herrajes y costo.
- Cliente de Supabase listo (`lib/supabase.ts`), aún sin conectar a ninguna pantalla.

## Etapa 2 (agregada)
- `lib/rules.ts`: motor de reglas y generador de propuestas, portado del HTML.
  Cuatro tipos de cocina (lineal, L, paralela, U) × 3 estrategias, probado a mano
  con 24 combinaciones (los 4 tipos × H70/H80 × las 3 estrategias): todas calzan
  exactamente en cada muro.
- `/recinto`: formulario de recinto (tipo, largos de muro, altura de bajos,
  lavaplatos, refrigerador, aéreos) + tarjetas de propuesta (vista previa del
  muro, módulos, ml de bajos y de aéreos, precio neto/IVA/total).
- "Usar esta propuesta" guarda la cocina en `vc_cocinas` de Supabase si hay
  sesión iniciada (todavía no hay pantalla de login — próxima etapa).
- Las reglas están fijas en código por ahora (no hay pantalla "Reglas de diseño"
  para editarlas todavía).

## Qué falta (próximas etapas)
- Login / registro (Supabase Auth) y el editor `/cocina/[id]` (planta, elevaciones,
  arrastrar y soltar, mecanizado) — hoy "Usar esta propuesta" guarda en Supabase
  pero no hay pantalla para abrir y seguir editando esa cocina.
- Pantalla para editar las reglas de diseño (hoy están fijas en `lib/rules.ts`).
- Módulos propios (Diseñar módulos), catálogo de materiales y tapacanto con precios propios.
- Los dibujos (`lib/drawing.ts`) siguen generando un string SVG como el HTML original,
  en vez de JSX puro — funciona bien, pero conviene reescribirlo más adelante.
- La vista previa del muro en las tarjetas de propuesta es una barra proporcional,
  no la planta 2D con esquinas/puertas que tiene el HTML — llega con el editor.

## Cómo subirlo (mismo flujo que Arrendia)
1. Sube esta carpeta completa a un repo de GitHub (usa el editor web o "Add file → Upload files",
   arrastrando todos los archivos y carpetas manteniendo la estructura).
2. En Vercel: **Add New → Project** → importa el repo. Vercel detecta Next.js solo,
   no hay que tocar nada del build.
3. En Vercel → Settings → Environment Variables, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   (los mismos valores que ya usas en la versión HTML — mismo proyecto de Supabase,
   mismas tablas, no hay que correr SQL de nuevo).
4. Deploy.

## Si el build falla en Vercel
Pégame el log completo del build tal cual — igual que con Arrendia, lo reviso a ciegas
y te devuelvo el archivo corregido.
