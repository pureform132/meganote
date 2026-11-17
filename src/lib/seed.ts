/* Espacio de trabajo inicial — contenido de ejemplo escrito a mano, en español. */
import { emptyBlock, newId, now, type AppStore, type Block, type DBRow, type Notebook, type Page } from './types';

function b(type: Block['type'], html: string, extra: Partial<Block> = {}): Block {
  const text = html.replace(/<[^>]+>/g, '');
  return { id: newId(), type, text, html, level: 0, ...extra };
}

function page(p: Partial<Page> & Pick<Page, 'title' | 'icon'>): Page {
  const t = now();
  return {
    id: newId(),
    parentId: null,
    kind: 'page',
    favorite: false,
    trashed: false,
    blocks: [emptyBlock('text')],
    created: t,
    updated: t,
    ...p,
  };
}

function offsetDate(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function row(name: string, status: string, priority: string, due: string, done: boolean): DBRow {
  return { id: newId(), cells: { 'c-name': name, 'c-status': status, 'c-priority': priority, 'c-due': due, 'c-done': done } };
}

export function seedStore(): AppStore {
  const t = now();

  const welcome = page({
    title: 'Bienvenido a Takenotes',
    icon: 'sun',
    favorite: true,
    blocks: [
      b('text', 'Tu cuaderno vive en esta máquina — sin cuenta, sin nube, sin esperas. Todo lo que escribes se guarda localmente en tu navegador y sigue siendo tuyo.'),
      b('callout', 'Escribe <code>/</code> en cualquier punto para insertar un bloque. Pulsa <code>Ctrl</code>+<code>K</code> para saltar a cualquier página o buscarlo todo.'),
      b('h2', 'Qué puedes hacer aquí'),
      b('bulleted', '<b>Bloques</b> — párrafos, encabezados, listas, to-dos, toggles, citas, código, callouts, imágenes y divisores.'),
      b('bulleted', '<b>Páginas dentro de páginas</b> — el árbol de la barra lateral anida sin límite.'),
      b('bulleted', '<b>Bases de datos</b> — un conjunto de datos, tres vistas: tabla, tablero Kanban y calendario. Y también <b>gráfico</b>.'),
      b('bulleted', '<b>Encuentra cualquier cosa</b> — búsqueda a texto completo en títulos, bloques y filas de tus bases de datos.'),
      b('bulleted', '<b>Importa desde Notion</b> — en Notion: Configuración → Exportar → Markdown y CSV → sube el .zip aquí (sidebar → icono de importar).'),
      b('h2', 'Memoria muscular de Markdown'),
      b('text', 'Empieza un bloque con <code>#</code>, <code>-</code>, <code>1.</code>, <code>[]</code>, <code>&gt;</code> o <code>```</code> y pulsa espacio.'),
      b('divider', ''),
      b('text', '<i>Esta página fue escrita por Takenotes para saludarte. Reemplázala por lo que tengas en la cabeza.</i>'),
    ],
  });

  const gettingAround = page({
    title: 'Cómo moverte',
    icon: 'compass',
    blocks: [
      b('h2', 'El mapa del cuaderno'),
      b('text', 'El borde izquierdo es el índice: buscador arriba, el árbol de páginas debajo, favoritos con estrella, y la papelera al fondo. Haz clic en la flecha para plegar una rama; haz clic en una página para abrirla.'),
      b('bulleted', '<b>Nueva página</b> — el botón terracota crea una página donde estés mirando.'),
      b('bulleted', '<b>Estrella</b> — pasa el cursor por una página del árbol y fíjala como favorita.'),
      b('bulleted', '<b>Papelera</b> — los borrados son reversibles hasta que vacíes la papelera.'),
      b('bulleted', '<b>Workspaces</b> — cambia entre cuadernos (Personal, Trabajo…) en el selector de arriba de la barra lateral.'),
      b('quote', 'Una app de notas se gana la confianza nunca perdiendo un pensamiento.'),
    ],
  });

  const shortcuts = page({
    title: 'Atajos de teclado',
    icon: 'keyboard',
    parentId: gettingAround.id,
    blocks: [
      b('h2', 'Dedos, no ratón'),
      b('bulleted', '<code>Ctrl</code>+<code>K</code> — apertura rápida y búsqueda de texto completo'),
      b('bulleted', '<code>/</code> — menú de comandos (funciona en cualquier bloque)'),
      b('bulleted', '<code>Enter</code> — nuevo bloque debajo · <code>Shift</code>+<code>Enter</code> — salto suave'),
      b('bulleted', '<code>Backspace</code> en un bloque vacío — fusionar con el anterior'),
      b('bulleted', '<code>Tab</code> / <code>Shift</code>+<code>Tab</code> — indentar y de-indentar listas y toggles'),
      b('bulleted', 'Formato inline: <code>Ctrl</code>+<code>B</code> negrita · <code>I</code> itálica · <code>Shift</code>+<code>X</code> tachado · <code>`</code> código inline'),
      b('bulleted', 'Atajos al inicio del bloque: <code>#</code> h1 · <code>##</code> h2 · <code>###</code> h3 · <code>-</code> viñetas · <code>1.</code> numerada · <code>[]</code> to-do · <code>&gt;</code> cita · <code>```</code> código'),
    ],
  });

  const cabin = page({
    title: 'Plan de fin de semana en la cabaña',
    icon: 'leaf',
    blocks: [
      b('h2', 'Antes de conducir'),
      b('todo', 'Reservar el permiso de aparcamiento del trailhead', { checked: true }),
      b('todo', 'Llenar los bidones de agua, dos', { checked: true }),
      b('todo', 'Cargar los walkie-talkies y coger pilas de repuesto'),
      b('todo', 'Imprimir mapa offline del filo norte'),
      b('todo', 'Llamar al capitán del puerto por el horario del ferry'),
      b('h2', 'Lista de equipo'),
      b('bulleted', 'Café, avena, huevos, la buena sal'),
      b('bulleted', 'Capas térmicas y la linterna frontal que todos pierden'),
      b('bulleted', 'Cartas, el bolsilibro, una novela indulgente'),
      b('callout', 'Si el filo noreste amanece cubierto el sábado, cambia la caminata por el circuito del lago. No negocies con las nubes.'),
    ],
  });

  const pipeline: Page = {
    id: newId(),
    parentId: null,
    title: 'Pipeline de contenidos',
    icon: 'table',
    kind: 'database',
    favorite: false,
    trashed: false,
    created: t,
    updated: t,
    blocks: [],
    db: {
      columns: [
        { id: 'c-name', name: 'Nombre', type: 'text' },
        {
          id: 'c-status',
          name: 'Estado',
          type: 'select',
          options: [
            { id: 'o-idea', label: 'Idea', tone: 'ink' },
            { id: 'o-doing', label: 'En progreso', tone: 'terra' },
            { id: 'o-edit', label: 'Editando', tone: 'sage' },
            { id: 'o-live', label: 'Publicado', tone: 'sage' },
          ],
        },
        {
          id: 'c-priority',
          name: 'Prioridad',
          type: 'select',
          options: [
            { id: 'o-low', label: 'Baja', tone: 'sage' },
            { id: 'o-med', label: 'Media', tone: 'ink' },
            { id: 'o-high', label: 'Alta', tone: 'terra' },
          ],
        },
        { id: 'c-due', name: 'Entrega', type: 'date' },
        { id: 'c-done', name: 'Hecho', type: 'checkbox' },
      ],
      rows: [
        row('Notas de campo del filo norte', 'o-doing', 'o-high', offsetDate(3), false),
        row('Por qué tu README es tu puerta principal', 'o-edit', 'o-med', offsetDate(6), false),
        row('El poder tranquilo de una bandeja de texto plano', 'o-idea', 'o-low', offsetDate(9), false),
        row('Notas sobre mañanas lentas y trabajo profundo', 'o-live', 'o-med', offsetDate(-12), true),
        row('Guía de campo para mejores valores por defecto', 'o-idea', 'o-high', offsetDate(14), false),
        row('Lo que aprendí renombrando 400 archivos', 'o-edit', 'o-low', offsetDate(2), false),
        row('El manifiesto para una mesa más tranquila', 'o-live', 'o-high', offsetDate(-21), true),
      ],
      view: 'table',
      filter: '',
      sortColumnId: null,
      sortDir: 'asc',
      groupByColumnId: 'c-status',
      calendarColumnId: 'c-due',
    },
  };

  const library = page({
    title: 'Biblioteca — libros por terminar',
    icon: 'book',
    blocks: [
      b('bulleted', '<b>Los anillos de Saturno</b> — Sebald, releyendo por tercera vez'),
      b('bulleted', '<b>How Big Things Get Done</b> — Flyvbjerg'),
      b('bulleted', '<b>El peregrino</b> — Baker'),
      b('todo', 'Terminar el ensayo de Sebald sobre Flaubert'),
      b('todo', 'Devolver el préstamo de la biblioteca antes del 28'),
    ],
  });

  const notebook: Notebook = {
    id: newId(),
    name: 'Personal',
    icon: 'leaf',
    created: now(),
    pages: [welcome, gettingAround, shortcuts, cabin, pipeline, library],
  };

  return { version: 2, notebooks: [notebook], currentId: notebook.id };
}
