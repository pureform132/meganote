# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [1.1.0] — 2026-11-17

### Añadido

- **Subpáginas**: crea una página hija desde el encabezado o con `/subpágina`; aparece como tarjeta dentro del padre y en el árbol lateral.
- **Stickers de página**: 43 iconos propios con buscador y cuatro grupos (Esenciales, Naturaleza, Vida, Símbolos).
- **Portadas**: seis tonos planos de la paleta (Salvia, Terracota, Papel, Amanecer, Atardecer, Noche) con cambio y borrado.
- **Tabla de contenido**: bloque `/toc` generado automáticamente desde H1–H3, con navegación al encabezado.
- **Duplicar página**: copia la página y todo su subárbol, incluidos bases de datos y referencias internas.
- **Mover página**: diálogo con buscador y árbol de destinos, con protección contra ciclos.
- **Enlaces a páginas y backlinks**: bloque `Enlace a página` con selector y sección «Mencionada en».
- **Vista Galería** para bases de datos, con tarjetas editables y portada por tono.
- **Gráficos**: cuatro tipos (barras, horizontal, líneas/área y donut), agrupación por selección/fecha/casilla/texto, métrica de recuento/suma/media y tarjetas de resumen.
- Columna numérica de ejemplo «Esfuerzo (h)» para probar suma y media.

### Corregido

- El DOM editable ya no conserva el texto `/comando` al convertir un bloque en índice, enlace o subpágina.
- Las portadas usan formas planas, no degradados, para respetar «The Paper Desk».

## [1.0.0] — 2026-11-17

Primera versión pública de Takenotes.

### Añadido

- Editor de bloques: texto, H1–H3, listas, to-dos, toggles, citas, código, destacados, divisores, imágenes y adjuntos de cualquier tipo (hasta 8 MB).
- Menú de comandos `/` con 14 tipos de bloque y navegación por teclado.
- Formato inline (`Ctrl+B`, `Ctrl+I`, `Ctrl+Shift+X`, `` Ctrl+` ``) y atajos Markdown al inicio de bloque.
- Páginas anidadas, favoritos, papelera reversible y restauración en cascada.
- Búsqueda a texto completo (`Ctrl/Cmd+K`) en títulos, bloques y filas de bases de datos.
- Bases de datos con propiedades de texto, número, selección, fecha y casilla.
- Cuatro vistas: tabla, kanban con drag & drop, calendario y gráfico de barras SVG.
- Varios workspaces con creación, cambio y renombrado; migración automática v1→v2.
- Importación del export oficial de Notion (**Markdown y CSV**): jerarquía, bloques, bases de datos e imágenes incrustadas.
- Modo oscuro «The Night Desk» y modo claro, con preferencia persistente.
- Copia de seguridad JSON, restauración validada y exportación Markdown por página.
- App de escritorio para Windows (PyInstaller + WebView2, ~13 MB) y build web autocontenido.
- Landing page y documentación de producto/diseño.

### Corregido

- El panel de importación ya no se comprime dentro de la barra lateral: aparece como tarjeta flotante.
- Las fechas del calendario se calculan en ISO local, sin desplazamientos por zona horaria.
- La búsqueda indexa también las celdas de bases de datos.

### Limitaciones conocidas

- Sin colaboración en tiempo real, IA ni publicaciones web.
- El ejecutable de Windows no tiene firma comercial (SmartScreen puede avisar).
- Los adjuntos de Notion que no son imágenes se importan como referencia textual.
