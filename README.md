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

## Etapa 3 (agregada)
- `components/AuthBar.tsx` + `lib/useSession.ts`: iniciar sesión, crear cuenta y
  cerrar sesión con Supabase Auth, visible en `/recinto` y en el editor.
- `/cocina/[id]`: abre una cocina guardada, muestra sus muros con los módulos
  reales (código, ancho, precio), permite cambiar el módulo de cada casillero
  (selector agrupado en Bajos/Torres), quitar módulos, agregar uno nuevo,
  y recalcula los totales (módulos, ml de bajos, ml de aéreos, neto, IVA) al vuelo.
  "Guardar" actualiza la fila en `vc_cocinas`; "Eliminar" la borra y vuelve a `/recinto`.
- "Usar esta propuesta" en `/recinto` ahora guarda la cocina y te lleva directo
  a `/cocina/[id]` para seguir editándola.

## Etapa 4 (agregada)
- `/reglas`: pantalla para editar las reglas de diseño (antes fijas en código).
  Por tipo de cocina (lineal, L, paralela, U): editar nombre, agregar/quitar muros
  (pared, si descuenta profundidad de esquina), y por muro agregar/quitar/editar
  elementos (módulo obligatorio u opcional con su ancho preferido, hueco de
  refrigerador, o zona libre con peso relativo). Duplicar un tipo como uno nuevo,
  eliminar un tipo, restablecer los valores de fábrica.
- Las reglas se guardan en `vc_config.reglas` (misma tabla y columna que ya usa
  el HTML) — si tienes cuenta, tus reglas guardadas ahí ya se leerán aquí también.
  Sin sesión, se usan y se pueden probar las reglas de fábrica, sin guardar.
- `/recinto` ahora usa las reglas guardadas del usuario (o las de fábrica si no
  hay sesión o no ha guardado ninguna) en vez de las reglas fijas de antes.
- Corregido: crear cuenta/iniciar sesión ya no llama a Supabase si dejaste el
  correo o la clave vacíos (evita el error "anonymous sign-ins are disabled").

## Qué falta (próximas etapas)
- Módulos propios (Diseñar módulos), catálogo de materiales y tapacanto con precios propios.
- Mecanizado, catálogo imprimible, artefactos de cocina, recinto (medidas/puertas/ventanas).
- Los dibujos (`lib/drawing.ts`) siguen generando un string SVG como el HTML original,
  en vez de JSX puro — funciona bien, pero conviene reescribirlo más adelante.
- La vista previa del muro (en las tarjetas de propuesta) es una barra proporcional,
  no la planta 2D con esquinas/puertas del HTML — la planta real es del editor de dibujo,
  que dijimos dejar para más adelante.

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
