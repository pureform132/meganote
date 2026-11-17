/* Takenotes data model — independent implementation. */

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
  | 'file'
  | 'subpage'
  | 'pageLink'
  | 'toc';

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
  /** subpage and pageLink blocks: target page id */
  pageId?: string;
}

export type PropertyType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface DBColumn {
  id: string;
  name: string;
  type: PropertyType;
  /** select columns only */
  options?: { id: string; label: string; tone: 'sage' | 'terra' | 'ink' }[];
}

export interface DBRow {
  id: string;
  cells: Record<string, string | number | boolean | null>;
}

export type DBView = 'table' | 'board' | 'calendar' | 'chart' | 'gallery';

/** Chart types observed in Notion's icon set: chartLine, chartDonut, chartArea, chartAlternate. */
export type ChartKind = 'bar' | 'horizontal' | 'line' | 'donut';

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
  /** chart preferences (optional: old databases fall back to bars by status) */
  chartKind?: ChartKind;
  chartColumnId?: string | null;
  chartMetricColumnId?: string | null;
  chartMetricOp?: 'sum' | 'avg';
}

export type PageKind = 'page' | 'database';

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  /** id into the authored icon set, or empty for default doc icon */
  icon: string;
  /** cover preset id (a CSS gradient from the four-color palette) */
  cover?: string;
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

function opt(id: string, label: string, tone: 'sage' | 'terra' | 'ink') {
  return { id, label, tone };
}

export function defaultDBState(): DBState {
  return {
    columns: [
      { id: 'c-name', name: 'Nombre', type: 'text' },
      {
        id: 'c-status',
        name: 'Estado',
        type: 'select',
        options: [opt('o-idea', 'Idea', 'ink'), opt('o-doing', 'En progreso', 'terra'), opt('o-done', 'Hecho', 'sage')],
      },
      {
        id: 'c-priority',
        name: 'Prioridad',
        type: 'select',
        options: [opt('o-low', 'Baja', 'sage'), opt('o-med', 'Media', 'ink'), opt('o-high', 'Alta', 'terra')],
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
    chartKind: 'bar',
    chartColumnId: 'c-status',
    chartMetricColumnId: null,
    chartMetricOp: 'sum',
  };
}
