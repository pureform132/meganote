import { useMemo } from 'react';
import { Icon, type IconName } from '../lib/icons';
import type { BlockType } from '../lib/types';

export interface SlashCommand {
  type: BlockType;
  label: string;
  hint: string;
  icon: IconName;
  keywords: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { type: 'text', label: 'Texto', hint: 'Párrafo simple', icon: 'text', keywords: 'texto parrafo cuerpo normal escribir' },
  { type: 'h1', label: 'Encabezado 1', hint: 'Título grande de sección', icon: 'heading', keywords: 'h1 titulo encabezado grande' },
  { type: 'h2', label: 'Encabezado 2', hint: 'Título mediano de sección', icon: 'heading', keywords: 'h2 subtitulo seccion' },
  { type: 'h3', label: 'Encabezado 3', hint: 'Título pequeño de sección', icon: 'heading', keywords: 'h3 titulo pequeno detalle' },
  { type: 'bulleted', label: 'Lista de viñetas', hint: 'Elementos sin orden', icon: 'bulletList', keywords: 'vinetas lista desordenada bullet' },
  { type: 'numbered', label: 'Lista numerada', hint: 'Elementos ordenados', icon: 'numberedList', keywords: 'numerada lista ordenada números' },
  { type: 'todo', label: 'To-do', hint: 'Casilla de tarea', icon: 'checkSquare', keywords: 'todo tarea casilla pendiente check' },
  { type: 'toggle', label: 'Desplegable', hint: 'Sección plegable', icon: 'toggle', keywords: 'desplegable toggle colapsar plegar' },
  { type: 'quote', label: 'Cita', hint: 'Cita destacada', icon: 'quote', keywords: 'cita quote mencion' },
  { type: 'code', label: 'Código', hint: 'Bloque de código', icon: 'code', keywords: 'codigo code snippet pre' },
  { type: 'callout', label: 'Destacado', hint: 'Nota resaltada con icono', icon: 'callout', keywords: 'callout aviso nota destacada resaltar info' },
  { type: 'subpage', label: 'Subpágina', hint: 'Una página dentro de esta página', icon: 'subpage', keywords: 'subpagina sub pagina hija dentro child anidar' },
  { type: 'pageLink', label: 'Enlace a página', hint: 'Menciona otra página', icon: 'pageLink', keywords: 'enlace link mencionar pagina referencia interna' },
  { type: 'toc', label: 'Tabla de contenido', hint: 'Índice de los encabezados', icon: 'toc', keywords: 'indice tabla contenido toc encabezados navegar' },
  { type: 'image', label: 'Imagen', hint: 'Desde URL o archivo', icon: 'image', keywords: 'imagen imagen foto archivo url subir' },
  { type: 'file', label: 'Archivo', hint: 'Adjunta cualquier archivo', icon: 'file', keywords: 'archivo archivo adjunto file adjuntar documento zip pdf' },
  { type: 'divider', label: 'Divisor', hint: 'Regla horizontal', icon: 'divider', keywords: 'divisor divisor separador regla hor' },
];

export function SlashMenu({
  query,
  selected,
  onHover,
  onPick,
  style,
}: {
  query: string;
  selected: number;
  onHover: (i: number) => void;
  onPick: (cmd: SlashCommand) => void;
  style: React.CSSProperties;
}) {
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="slash" style={style} role="listbox" aria-label="Insertar bloque">
      <p className="slash__head">Insertar bloque</p>
      <div className="slash__list">
        {items.length === 0 && <p className="slash__empty">Nada coincide con “{query}”. Prueba “to-do”, “código”, “cita”…</p>}
        {items.map((c) => {
          const i = items.indexOf(c);
          return (
            <button
              key={c.type + c.label}
              role="option"
              aria-selected={i === selected}
              className={`slashitem${i === selected ? ' is-sel' : ''}`}
              onMouseEnter={() => onHover(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // mantener el foco en el bloque
                onPick(c);
              }}
            >
              <span className="slashitem__ic"><Icon name={c.icon} size={16} /></span>
              <span>
                <span className="slashitem__label">{c.label}</span>
                <br />
                <span className="slashitem__hint">{c.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
