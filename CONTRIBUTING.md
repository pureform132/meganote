# Contribuir a Takenotes

Gracias por querer mejorar Takenotes. Es un proyecto pequeño y las contribuciones se revisan con cariño: errores, accesibilidad, traducción, rendimiento, nuevas vistas de base de datos o mejoras del importador de Notion.

## Antes de empezar

- Abre un **issue** para bugs reproducibles o propuestas grandes antes de escribir código.
- Para cambios pequeños (typos, estilos, un test) puedes ir directo al PR.
- Sé amable. Lee el [código de conducta](CODE_OF_CONDUCT.md).

## Entorno

Requisitos: **Node.js 20+** y npm. Para el ejecutable de Windows, Python 3.10+ y WebView2.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview  # sirve dist/
```

## Reglas del proyecto

1. **Cuatro colores, siempre.** Papel `#FDFCF8`, tinta `#2E2A26`, terracota `#C65D3B`, salvia `#9AA88A` — y sus mezclas. No introduzcas un quinto matiz, ni siquiera para estados «semánticos».
2. **Nada de red en tiempo de ejecución.** Sin analítica, sin fuentes remotas, sin llamadas a APIs. La app debe funcionar con el WiFi apagado.
3. **La interfaz está en español.** El código, los nombres de variables y los comentarios pueden estar en inglés o español; los textos visibles, en español.
4. **Los datos no se pierden.** Cualquier cambio en el modelo debe mantener la migración de IndexedDB y la exportación JSON/Markdown.
5. **Accesibilidad real.** Roles y etiquetas ARIA en controles nuevos, foco visible, contraste AA, navegación por teclado.

## Antes de abrir un PR

```bash
npm run build
```

Debe terminar sin errores de TypeScript. Si tocas la UI, adjunta una captura del antes/después en modo claro y oscuro.

## Estilo

- Componentes funcionales y hooks; sin clases.
- TypeScript estricto; evita `any`.
- CSS en `src/styles/app.css`, con las variables existentes (`--paper`, `--ink`, `--terra`, `--sage` y sus derivados).
- Nombres de archivos y componentes en inglés; copy de interfaz en español.
- Commits en imperativo: `fix: evita que el importador pierda imágenes`, `feat: vista de gráfico`.

## Licencia

Al contribuir aceptas que tu trabajo se publique bajo la [licencia MIT](LICENSE) del proyecto.
