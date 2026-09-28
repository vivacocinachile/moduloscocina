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

## Qué falta (próximas etapas)
- Módulos propios (Diseñar módulos), catálogo de materiales y tapacanto con precios propios.
- El editor de planta y elevaciones (arrastrar y soltar, mecanizado, reglas de diseño).
- Guardar cocinas y usuarios en Supabase (las tablas ya existen, solo falta conectar las pantallas).
- Los dibujos (`lib/drawing.ts`) siguen generando un string SVG como el HTML original,
  en vez de JSX puro — funciona bien, pero conviene reescribirlo más adelante.

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
