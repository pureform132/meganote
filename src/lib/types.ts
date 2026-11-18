/* MEGAnote data model — independent implementation. */

export type BlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bulleted'
  | 'numbered'
  | 'todo'
  | 'toggle'
  | 'quote'
  | 'code'
  | 'callout'
  | 'divider'
  | 'image'
  | 'file';

export interface Block {
  id: string;
  type: BlockType;
  /** Plain-text content of the block. Inline formatting is kept as HTML in `html`. */
  text: string;
  /** Sanitized HTML for inline formatting (bold/italic/code/strike). */
  html: string;
  /** todo blocks only */
  checked?: boolean;
  /** toggle blocks only */
  open?: boolean;
  /** indent depth 0–4 for lists, toggles, quotes, todos */
  level: number;
  /** code blocks: language label */
  lang?: string;
  /** image blocks */
  src?: string;
  alt?: string;
  /** file blocks */
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
}

export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone';

/** Etiquetas de color al estilo Notion (paleta de opciones de selección del cliente web v7.44.0). */
export type TagColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red';

export const ALL_TAG_COLORS: readonly TagColor[] = [
  'default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red',
];

/** Rotación para opciones nuevas (ciclo Notion). */
export const TAG_COLOR_CYCLE: readonly TagColor[] = [
  'gray', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red', 'brown', 'default',
];

/** tone → color (migración de datos previos). */
export function legacyToneToColor(tone: unknown): TagColor {
  if (typeof tone === 'string' && (ALL_TAG_COLORS as readonly string[]).includes(tone)) return tone as TagColor;
  if (tone === 'ink') return 'gray';
  if (tone === 'terra') return 'orange';
  if (tone === 'sage') return 'green';
  return 'default';
}

export type NumberFormat =
  | 'plain' | 'commas' | 'percent'
  | 'dollar' | 'australian_dollar' | 'canadian_dollar' | 'singapore_dollar' | 'euro' | 'pound'
  | 'yen' | 'ruble' | 'rupee' | 'won' | 'yuan' | 'real' | 'lira' | 'rupiah' | 'franc'
  | 'hong_kong_dollar' | 'new_zealand_dollar' | 'krona' | 'norwegian_krone' | 'mexican_peso'
  | 'rand' | 'new_taiwan_dollar' | 'danish_krone' | 'zloty' | 'baht' | 'forint';

export interface SelectOption {
  id: string;
  label: string;
  color: TagColor;
}

export interface DBColumn {
  id: string;
  name: string;
  type: PropertyType;
  /** select / multi_select */
  options?: SelectOption[];
  /** number only — formato de presentación (Notion) */
  numberFormat?: NumberFormat;
  /** number only — 0..5, null = sin tope */
  numberPrecision?: number | null;
}

/** Valor de celda: string[] sólo en multi_select (ids de opciones). */
export type CellValue = string | number | boolean | null | string[];

export interface DBRow {
  id: string;
  cells: Record<string, CellValue>;
  /** Portada para la vista Galería: URL o data URL (imagen ≤1.5 MB) */
  cover?: string;
}

export type DBView = 'table' | 'board' | 'gallery' | 'list' | 'timeline' | 'calendar' | 'chart';

export interface DBState {
  columns: DBColumn[];
  rows: DBRow[];
  view: DBView;
  filter: string;
  sortColumnId: string | null;
  sortDir: 'asc' | 'desc';
  /** board grouping column (a select column) */
  groupByColumnId: string | null;
  /** calendar date column */
  calendarColumnId: string | null;
}

export type PageKind = 'page' | 'database';

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  /** id into the authored icon set, or empty for default doc icon */
  icon: string;
  kind: PageKind;
  favorite: boolean;
  trashed: boolean;
  blocks: Block[];
  db?: DBState;
  created: number;
  updated: number;
}

export interface Workspace {
  version: 1;
  pages: Page[];
}

/** v2: multiple notebooks sharing one store. */
export interface Notebook {
  id: string;
  name: string;
  icon: string;
  created: number;
  pages: Page[];
}

export interface AppStore {
  version: 2;
  notebooks: Notebook[];
  currentId: string;
}

export function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 1e6).toString(36)
  );
}

export function now(): number {
  return Date.now();
}

export function emptyBlock(type: BlockType = 'text'): Block {
  return { id: newId(), type, text: '', html: '', level: 0 };
}

export function emptyPage(parentId: string | null, kind: PageKind = 'page'): Page {
  const t = now();
  return {
    id: newId(),
    parentId,
    title: '',
    icon: kind === 'database' ? 'table' : 'doc',
    kind,
    favorite: false,
    trashed: false,
    blocks: kind === 'page' ? [emptyBlock('text')] : [],
    db: kind === 'database' ? defaultDBState() : undefined,
    created: t,
    updated: t,
  };
}

function opt(id: string, label: string, color: TagColor) {
  return { id, label, color };
}

export function defaultDBState(): DBState {
  return {
    columns: [
      { id: 'c-name', name: 'Nombre', type: 'text' },
      {
        id: 'c-status',
        name: 'Estado',
        type: 'select',
        options: [opt('o-idea', 'Idea', 'gray'), opt('o-doing', 'En progreso', 'orange'), opt('o-done', 'Hecho', 'green')],
      },
      {
        id: 'c-priority',
        name: 'Prioridad',
        type: 'select',
        options: [opt('o-low', 'Baja', 'green'), opt('o-med', 'Media', 'gray'), opt('o-high', 'Alta', 'red')],
      },
      { id: 'c-due', name: 'Entrega', type: 'date' },
      { id: 'c-done', name: 'Hecho', type: 'checkbox' },
    ],
    rows: [],
    view: 'table',
    filter: '',
    sortColumnId: null,
    sortDir: 'asc',
    groupByColumnId: 'c-status',
    calendarColumnId: 'c-due',
  };
}

/** Migración en carga: tone → color en columnas antiguas; idempotente. */
export function migrateDB(db: DBState): void {
  for (const col of db.columns) {
    if (col.options) {
      for (const o of col.options) {
        (o as SelectOption).color = legacyToneToColor((o as { tone?: unknown; color?: unknown }).color ?? (o as { tone?: unknown }).tone);
        delete (o as { tone?: unknown }).tone;
      }
    }
    if (col.type === 'number' && col.numberFormat === undefined) col.numberFormat = 'plain';
  }
}
