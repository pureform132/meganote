# MEGAnote

**Tus notas, en papel.** Una app de notas local-first con las funciones de Notion — editor de bloques, comandos con `/`, páginas anidadas, búsqueda a texto completo y bases de datos con **7 vistas** (Tabla / Tablero kanban / **Galería con portadas** / Lista / Línea de tiempo / Calendario / **Gráfico**) — reconstruida desde cero como un cuaderno cálido y tranquilo. **Sin cuenta. Sin nube. Sin telemetría.** Tus páginas se guardan en el IndexedDB de esta máquina y nunca salen de ella.

> El branding y la interfaz son propios. Solo se replicaron las *funciones* de la app de escritorio de Notion (v7.44.0, analizada localmente con REA): estructura shell+tabs, `notion://`, almacenamiento offline estilo SQLite, árbol de páginas, vistas de base de datos, inserción con `/`.
> **No se reutiliza ningún código, asset, token ni texto de Notion** — la implementación es original.
> El análisis se hizo leyendo el paquete MSIX instalado (el pipeline de import/export de Notion es remoto; el shell solo orquesta por IPC). Por eso el importador usa el **export oficial Markdown y CSV** de Notion.

**Nota de renombrado (MEGAnote → MEGAnote):** tus notas no se pierden — en el primer arranque MEGAnote migra solo el almacén antiguo (IndexedDB `meganote` → `meganote`) y copia `%APPDATA%\MEGAnote` → `%APPDATA%\MEGAnote`.

## Ejecutarlo

```bash
npm install     # solo si falta node_modules
npm run dev     # desarrollo
npm run build   # build de producción
npm run preview # servir el build
```

**App de escritorio (Windows):** `MEGAnote.exe` en tu Escritorio (también en `release-py/`). Ventana nativa sobre WebView2, ~13 MB, notas persistentes en `%APPDATA%\MEGAnote`. Doble clic y escribe. Ver abajo "Recompilar la app de escritorio".

## Funcionalidades

- **Editor de bloques** — texto, H1–H3, listas, to-dos, toggles, citas, código, destacados, divisores, imágenes (URL/archivo ≤1.5 MB) y **archivos** (cualquier tipo, ≤8 MB)
- **Iconos de página** — más de **70 iconos propios** (buscador incluido), con opción de cambiar el de cualquier página u objeto desde el encabezado, igual que en Notion
- **Formato inline** — `Ctrl/Cmd+B` negrita, `Ctrl/Cmd+I` itálica, `Ctrl/Cmd+Shift+X` tachado, `Ctrl+\`` código
- **Menú `/`** — 14 tipos de bloque, navegable con teclado
- **Atajos Markdown** — `#`, `##`, `###`, `-`, `1.`, `[]`, `>`, ` ``` ` al inicio convierten al pulsar espacio
- **Páginas anidadas** — árbol infinito en la barra lateral; favoritos; papelera reversible (hasta vaciar); las subpáginas se muestran dentro de cada página
- **Búsqueda** — `Ctrl/Cmd+K`: salto rápido y búsqueda de texto completo en títulos, bloques **y filas de bases de datos**
- **Bases de datos** — texto, número (con **formatos**: simple, separador, %, 25 monedas y decimales 0–5), selección y **selección múltiple** (ambas con **paleta de 10 colores** al estilo Notion), fecha, casilla, **URL**, **correo** y **teléfono** (celdas de enlace). Vistas (7):
  - **Tabla** (ordenar, filtrar, editar inline, columnas add/rename/delete)
  - **Tablero** (kanban con drag & drop, agrupado por cualquier selección)
  - **Galería** (tarjetas con **portada de imagen** — URL o archivo ≤1.5 MB, botón 📷 al pasar el ratón — y hasta 3 propiedades)
  - **Lista** (filas compactas agrupadas por selección)
  - **Línea de tiempo** (ejes de meses; cada fila como hito sobre su fecha)
  - **Calendario** (mes, clic en un día añade fila con fecha)
  - **Gráfico** (barras SVG coloreadas; agrupa por **cualquier** columna: selección, fecha, casilla, texto o número)
- **Menú de propiedad** (clic en el encabezado de columna) — renombrar, **cambiar el tipo** (con conversión de valores, como en Notion), formato y decimales del número, color y texto de cada opción, duplicar, eliminar y ordenar
- **Escribir en cualquier parte** — clic en el lienzo vacío (o en la franja inferior) crea/enfoca un bloque ahí, como en Notion
- **Subpáginas visibles** — cada página y base de datos lista sus subpáginas; el botón `+` en el árbol (al pasar el ratón) crea una subpágina. Las páginas cuyo padre ya no existe se muestran en la raíz, nunca desaparecen
- **Deshacer / Rehacer globales** — botones en el pie de la barra lateral y `Ctrl/Cmd+Z` · `Ctrl/Cmd+Y` (o `Ctrl/Cmd+Shift+Z`), con ráfagas de tecleo agrupadas
- **Workspaces** — varios cuadernos con selector en la barra lateral (crear, cambiar, renombrar): Personal, Trabajo… cada uno con su árbol. Tus datos anteriores se migran solos a "Personal" en el primer arranque
- **Importar desde Notion** — en Notion: Configuración → **Exportar** → **Markdown y CSV** → descarga el .zip, en MEGAnote: icono de importar en el pie de la barra lateral → *Elegir .zip…* → tus páginas, jerarquía, bases de datos (CSV → tabla con tipos inferidos) e imágenes quedan importadas
- **Copia de seguridad completa** — botón de descarga (JSON) y restauración validada con confirmación; descarga de cualquier página como Markdown
- **Modo oscuro** — botón sol/luna en el pie de la barra lateral; "The Night Desk", los mismos 4 matices invertidos, persiste y sigue a tu SO en el primer arranque

## Datos — que nunca se pierdan

Auto-guardado local con indicador en vivo `Guardado · HH:MM`. Los cambios estructurales de bases de datos (tipos, columnas, opciones, filas) se guardan **al instante**; el tecleo se agrupa en 350 ms. Además la app intenta volcar el almacén al quedar oculta/cerrar (`pagehide`/`blur`) y pide almacenamiento persistente al navegador. Por eso, además:

- **Copia (JSON)** — descarga tu notebook entero como archivo en cualquier disco/Drive/USB
- **Restaurar (JSON)** — eliges un backup, MEGAnote lo valida, pide confirmación y restaura
- **Markdown** — botón de exportar en cada página
- **Escritorio** — el perfil WebView2 vive en `%APPDATA%\MEGAnote`, independiente del navegador

> Nada sale de tu máquina salvo que pulses tú el botón de backup.

## Stack y estructura

React 19 · Vite 7 · TypeScript · IndexedDB (hand-rolled, sin deps) · jszip + papaparse (importador) · sin backend.

```
src/
  App.tsx                  esqueleto: sidebar + lienzo + paleta + avisos
  state/WorkspaceContext   fuente única de verdad; save debounced + backups + importación
  lib/
    types.ts               modelo (bloques, páginas, bases de datos, AppStore multi-workspace)
    db.ts                  IndexedDB + migración v1→v2 ("Personal")
    seed.ts                cuaderno inicial en español
    notionImport.ts        importador del export oficial de Notion (md + csv → páginas/dbs)
    export.ts              exportes: JSON backup, Markdown
    html.ts                sanitizador de inline HTML
    theme.ts, icons.tsx    tema claro/oscuro + iconografía propia (SVG)
  components/              Sidebar (switcher/backups/importar), Editor (bloques),
                           DatabaseView (tabla/tablero/calendario/gráfico),
                           SearchPalette, SlashMenu, TrashView
  styles/app.css           sistema de diseño (4 matices + color-mix + tema [data-theme=dark])
```

## Recompilar la app de escritorio

```powershell
npm run build                                     # refresca dist/
python -m venv .venv-release                      # una vez
.venv-release\Scripts\pip install pywebview pyinstaller
.venv-release\Scripts\python scripts\meganote_app.py   # prueba la ventana
.venv-release\Scripts\pyinstaller --onefile --noconsole --name MEGAnote --icon scripts\icon.ico --add-data "dist;dist" --distpath release-py scripts\meganote_app.py
```

Iconos rasterizados desde `public/favicon.svg` con `scripts/make-icon.cjs` → `scripts/icon.ico`.

## Notas

- **Propiedades al estilo Notion:** el catálogo de tipos, la paleta de 10 colores de opción (`default/gray/brown/orange/yellow/green/blue/purple/pink/red`), los formatos numéricos y el flujo "cambiar tipo con conversión de valores" se extrajeron del **cliente web de Notion v7.44.0** (paquete MSIX + caché del cliente web) con REA. La implementación es propia; no se reutiliza código de Notion.
- `PRODUCT.md` y `DESIGN.md` son el registro de producto y diseño (flujo Impeccable). El sistema incluye **modo oscuro documentado** ("The Night Desk Rule").
- `npm run build` pasa `tsc -b` limpio; detector Impeccable: **0 hallazgos** mecánicos en `src/`.
- `node_modules` solo hace falta para desarrollar; restaura con `npm install`.
- Los documentos `PRODUCT.md`/`DESIGN.md` están en inglés por convención del flujo de diseño; la UI de la app está en español.
