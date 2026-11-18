/* Helpers de celdas de base de datos: texto, formato numérico (Notion) y conversión de tipos. */
import {
  newId, TAG_COLOR_CYCLE,
  type CellValue, type DBColumn, type DBRow, type DBState, type NumberFormat, type PropertyType, type SelectOption, type TagColor,
} from './types';

/** Catálogo de formatos numéricos de Notion (cliente web v7.44.0: number, number_with_commas, percent + monedas). */
export const NUMBER_FORMATS: { id: NumberFormat; label: string; symbol?: string; suffix?: boolean; grouping?: boolean }[] = [
  { id: 'plain', label: 'Número simple' },
  { id: 'commas', label: 'Número con separador', grouping: true },
  { id: 'percent', label: 'Porcentaje', suffix: true },
  { id: 'dollar', label: 'Dólar estadounidense', symbol: '$' },
  { id: 'euro', label: 'Euro', symbol: '€' },
  { id: 'pound', label: 'Libra esterlina', symbol: '£' },
  { id: 'yen', label: 'Yen japonés', symbol: '¥' },
  { id: 'yuan', label: 'Yuan chino', symbol: 'CN¥' },
  { id: 'won', label: 'Won surcoreano', symbol: '₩' },
  { id: 'rupee', label: 'Rupia india', symbol: '₹' },
  { id: 'real', label: 'Real brasileño', symbol: 'R$' },
  { id: 'ruble', label: 'Rublo ruso', symbol: '₽' },
  { id: 'franc', label: 'Franco suizo', symbol: 'CHF' },
  { id: 'mexican_peso', label: 'Peso mexicano', symbol: 'MX$' },
  { id: 'australian_dollar', label: 'Dólar australiano', symbol: 'A$' },
  { id: 'canadian_dollar', label: 'Dólar canadiense', symbol: 'CA$' },
  { id: 'singapore_dollar', label: 'Dólar de Singapur', symbol: 'S$' },
  { id: 'hong_kong_dollar', label: 'Dólar de Hong Kong', symbol: 'HK$' },
  { id: 'new_zealand_dollar', label: 'Dólar neozelandés', symbol: 'NZ$' },
  { id: 'new_taiwan_dollar', label: 'Nuevo dólar taiwanés', symbol: 'NT$' },
  { id: 'krona', label: 'Corona sueca', symbol: 'kr', suffix: true },
  { id: 'norwegian_krone', label: 'Corona noruega', symbol: 'Nkr', suffix: true },
  { id: 'danish_krone', label: 'Corona danesa', symbol: 'Dkr', suffix: true },
  { id: 'rand', label: 'Rand sudafricano', symbol: 'R' },
  { id: 'zloty', label: 'Zloty polaco', symbol: 'zł', suffix: true },
  { id: 'baht', label: 'Baht tailandés', symbol: '฿' },
  { id: 'forint', label: 'Florín húngaro', symbol: 'Ft', suffix: true },
  { id: 'rupiah', label: 'Rupia indonesia', symbol: 'Rp' },
  { id: 'lira', label: 'Lira turca', symbol: '₺' },
];

export const NUMBER_PRECISIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Auto' },
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

function groupThousands(intPart: string): string {
  const neg = intPart.startsWith('-');
  const digits = neg ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return neg ? '-' + grouped : grouped;
}

/** Formatea un número según la columna (estilo Notion: % multiplica ×100, moneda delante, precisión 0–5/auto). */
export function formatNumberCell(v: number, col: DBColumn): string {
  const fmt = col.numberFormat ?? 'plain';
  const meta = NUMBER_FORMATS.find((f) => f.id === fmt);
  const prec = col.numberPrecision ?? null;
  const applyComma = (s: string) => s.replace('.', ',');

  if (fmt === 'percent') {
    const n = v * 100;
    const raw = prec == null ? String(n) : n.toFixed(prec);
    return `${applyComma(raw)}%`;
  }

  const wantsGrouping = !!meta?.grouping || (!!meta?.symbol && (prec != null || Math.abs(v) >= 1000));
  const raw = prec != null ? v.toFixed(prec) : String(v);
  const [int, dec] = raw.split('.');
  const grouped = wantsGrouping ? groupThousands(int) : int;
  const body = dec !== undefined ? `${grouped},${dec}` : grouped;

  if (meta?.symbol && !meta.suffix) return `${meta.symbol} ${body}`;
  if (meta?.symbol && meta.suffix) return `${body} ${meta.symbol}`;
  return body;
}

/** Texto de una celda para display/búsqueda/export (compartido por vistas, búsqueda y export). */
export function cellText(row: DBRow, col: DBColumn): string {
  const v = row.cells[col.id];
  return cellValueText(v, col);
}

export function cellValueText(v: CellValue, col: DBColumn): string {
  if (v == null) return '';
  if (Array.isArray(v)) {
    const labels = v.map((id) => col.options?.find((o) => o.id === id)?.label ?? String(id));
    return labels.join(', ');
  }
  switch (col.type) {
    case 'select':
      return col.options?.find((o) => o.id === v)?.label ?? String(v);
    case 'checkbox':
      return v ? 'sí' : 'no';
    case 'number':
      return typeof v === 'number' && Number.isFinite(v) ? formatNumberCell(v, col) : String(v);
    default:
      return String(v);
  }
}

export function nextColor(index: number): TagColor {
  return TAG_COLOR_CYCLE[index % TAG_COLOR_CYCLE.length];
}

export function emptyValueFor(type: PropertyType): CellValue {
  if (type === 'checkbox') return false;
  if (type === 'multi_select') return null;
  return null;
}

interface ConvCtx {
  col: DBColumn;
}

function ensureOption(ctx: ConvCtx, label: string): string {
  const existing = ctx.col.options?.find((o) => o.label.toLowerCase() === label.toLowerCase());
  if (existing) return existing.id;
  const option: SelectOption = { id: newId(), label, color: nextColor(ctx.col.options?.length ?? 0) };
  ctx.col.options = [...(ctx.col.options ?? []), option];
  return option.id;
}

function asMultiIds(v: CellValue, ctx: ConvCtx): string[] {
  if (v == null) return [];
  const items: string[] = Array.isArray(v) ? v : [String(v)];
  const out: string[] = [];
  for (const item of items) {
    const label = typeof item === 'number' ? String(item) : String(item);
    out.push(ensureOption(ctx, label));
  }
  return [...new Set(out)];
}

function parseNumber(v: CellValue): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/[%€$£¥₩₹₽]/g, '').replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  if (!s || !/-?\d/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: CellValue): string | null {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.trim())) return v.trim().slice(0, 10);
  const n = typeof v === 'number' ? v : Date.parse(String(v));
  if (typeof n === 'number' && Number.isFinite(n) && n > 0) {
    const d = new Date(n);
    const p = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  return null;
}

/** Conversión de un valor al cambiar el tipo de columna (mejor esfuerzo, estilo Notion). */
export function convertCellValue(v: CellValue, from: PropertyType, to: PropertyType, ctx: ConvCtx): CellValue {
  if (from === to) return v;
  if (v == null || v === '') return to === 'checkbox' ? false : null;

  if (to === 'multi_select') {
    if (from === 'select') return v ? [String(v)] : null;
    if (from === 'multi_select') return v;
    const ids = asMultiIds(
      Array.isArray(v) ? v : typeof v === 'boolean' ? (v ? 'sí' : 'no') : typeof v === 'number' ? cellNumberAsText(v) : String(v),
      ctx,
    );
    return ids.length ? ids : null;
  }
  if (to === 'select') {
    if (from === 'multi_select') {
      const first = Array.isArray(v) ? v[0] : null;
      return first ?? null;
    }
    const label =
      typeof v === 'boolean' ? (v ? 'sí' : 'no')
      : typeof v === 'number' ? cellNumberAsText(v)
      : String(v);
    return ensureOption(ctx, label);
  }
  if (to === 'checkbox') {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (Array.isArray(v)) return v.length > 0;
    const s = String(v).trim().toLowerCase();
    return !['no', 'false', '0', '', 'falso'].includes(s);
  }
  if (to === 'number') {
    if (Array.isArray(v)) return parseNumber(v[0] ?? null);
    if ((from === 'select' || from === 'multi_select') && typeof v === 'string') {
      const label = ctx.col.options?.find((o) => o.id === v)?.label ?? v;
      return parseNumber(label);
    }
    if (from === 'date' && typeof v === 'string') {
      const iso = parseDate(v);
      const ts = iso ? Date.parse(iso) : NaN;
      return Number.isFinite(ts) ? ts : null;
    }
    return parseNumber(v);
  }
  if (to === 'date') {
    if (Array.isArray(v)) return null;
    return parseDate(v);
  }
  // texto / url / email / phone
  if (Array.isArray(v)) return v.map((id) => ctx.col.options?.find((o) => o.id === id)?.label ?? String(id)).join(', ');
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  if (typeof v === 'number') return cellNumberAsText(v);
  if (from === 'select' && typeof v === 'string') {
    return ctx.col.options?.find((o) => o.id === v)?.label ?? v;
  }
  return String(v);
}

function cellNumberAsText(v: number): string {
  return String(v);
}

/** Cambia el tipo de una columna dentro del borrador y convierte todas sus celdas. */
export function convertColumn(db: DBState, colId: string, to: PropertyType): void {
  const col = db.columns.find((c) => c.id === colId);
  if (!col) return;
  const from = col.type;
  if (from === to) return;

  if ((to === 'select' || to === 'multi_select') && !col.options?.length) {
    col.options = [
      { id: newId(), label: 'Opción A', color: 'gray' },
      { id: newId(), label: 'Opción B', color: 'orange' },
    ];
  }
  if (to === 'number' && col.numberFormat === undefined) col.numberFormat = 'plain';

  const ctx: ConvCtx = { col };
  for (const row of db.rows) {
    row.cells[colId] = convertCellValue(row.cells[colId] ?? null, from, to, ctx);
  }
  col.type = to;

  // re-apuntar dependencias si el tipo nuevo no las admite
  if (db.sortColumnId === colId && to === 'checkbox') { /* permitido */ }
  if (db.groupByColumnId === colId && to !== 'select') {
    db.groupByColumnId = db.columns.find((c) => c.id !== colId && c.type === 'select')?.id ?? null;
  }
  if (db.calendarColumnId === colId && to !== 'date') {
    db.calendarColumnId = db.columns.find((c) => c.id !== colId && c.type === 'date')?.id ?? null;
  }
}

/** Valores iniciales para una fila nueva según el tipo de columna. */
export function initialCells(db: DBState, preset: Record<string, CellValue> = {}): DBRow['cells'] {
  const cells: DBRow['cells'] = {};
  for (const c of db.columns) cells[c.id] = emptyValueFor(c.type);
  Object.assign(cells, preset);
  return cells;
}
