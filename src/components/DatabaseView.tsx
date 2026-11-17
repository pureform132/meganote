import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';
import { newId, type ChartKind, type DBColumn, type DBRow, type DBView, type Page, type PropertyType } from '../lib/types';

const TONE_BY_INDEX = ['ink', 'terra', 'sage'] as const;

function cloneDB<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

function cellText(row: DBRow, col: DBColumn): string {
  const v = row.cells[col.id];
  if (v == null) return '';
  if (col.type === 'select') return col.options?.find((o) => o.id === v)?.label ?? String(v);
  if (col.type === 'checkbox') return v ? 'sí' : 'no';
  return String(v);
}

export function DatabaseView({ page }: { page: Page }) {
  const { updateDB, updatePage, toggleFavorite, trashPage } = useWorkspace();
  const db = page.db!;
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [openCell, setOpenCell] = useState<string | null>(null); // `${rowId}:${colId}`
  const [renamingCol, setRenamingCol] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [newOption, setNewOption] = useState('');
  const addPropRef = useRef<HTMLDivElement>(null);
  const cellPopRef = useRef<HTMLDivElement>(null);
  const dragRow = useRef<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (addPropOpen && !addPropRef.current?.contains(t)) setAddPropOpen(false);
      if (openCell && !cellPopRef.current?.contains(t) && !t.closest('.pill')) setOpenCell(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [addPropOpen, openCell]);

  const mutate = (fn: (draft: typeof db) => void) =>
    updateDB(page.id, (d) => {
      const draft = cloneDB(d);
      fn(draft);
      return draft;
    });

  const setView = (view: DBView) => mutate((d) => { d.view = view; });

  // filtro + orden
  const filteredRows = useMemo(() => {
    const f = db.filter.trim().toLowerCase();
    let rows = db.rows.filter((r) =>
      !f || db.columns.some((c) => cellText(r, c).toLowerCase().includes(f)),
    );
    if (db.sortColumnId) {
      const col = db.columns.find((c) => c.id === db.sortColumnId);
      const dir = db.sortDir === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = a.cells[col?.id ?? ''];
        const bv = b.cells[col?.id ?? ''];
        const an = av == null ? '' : String(av);
        const bn = bv == null ? '' : String(bv);
        if (col?.type === 'number') return (Number(av ?? -Infinity) - Number(bv ?? -Infinity)) * dir;
        if (col?.type === 'checkbox') return (Number(!!av) - Number(!!bv)) * dir;
        return an.localeCompare(bn, 'es') * dir;
      });
    }
    return rows;
  }, [db]);

  const addRow = (preset?: Record<string, string | number | boolean | null>) => {
    const id = newId();
    mutate((d) => {
      const cells: DBRow['cells'] = {};
      for (const c of d.columns) {
        cells[c.id] = c.type === 'checkbox' ? false : c.type === 'number' ? null : '';
      }
      Object.assign(cells, preset ?? {});
      d.rows.push({ id, cells });
    });
    return id;
  };

  const setCell = (rowId: string, colId: string, value: DBRow['cells'][string]) =>
    mutate((d) => {
      const row = d.rows.find((r) => r.id === rowId);
      if (row) row.cells[colId] = value;
    });

  const deleteRow = (rowId: string) => mutate((d) => { d.rows = d.rows.filter((r) => r.id !== rowId); });

  const addColumn = (type: PropertyType) => {
    mutate((d) => {
      const base = { id: newId(), name: type === 'text' ? 'Propiedad' : type === 'number' ? 'Número' : type === 'select' ? 'Selección' : type === 'date' ? 'Fecha' : 'Casilla', type } as DBColumn;
      if (type === 'select') {
        base.options = [
          { id: newId(), label: 'Opción A', tone: 'ink' },
          { id: newId(), label: 'Opción B', tone: 'terra' },
        ];
      }
      d.columns.push(base);
    });
    setAddPropOpen(false);
  };

  const deleteColumn = (colId: string) =>
    mutate((d) => {
      if (d.columns.length <= 1) return;
      d.columns = d.columns.filter((c) => c.id !== colId);
      for (const r of d.rows) delete r.cells[colId];
      if (d.sortColumnId === colId) d.sortColumnId = null;
      if (d.groupByColumnId === colId) d.groupByColumnId = d.columns.find((c) => c.type === 'select')?.id ?? null;
      if (d.calendarColumnId === colId) d.calendarColumnId = d.columns.find((c) => c.type === 'date')?.id ?? null;
    });

  const renameColumn = (colId: string, name: string) =>
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (col) col.name = name.trim() || col.name;
    });

  const addSelectOption = (colId: string, label: string) => {
    const id = newId();
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (!col || col.type !== 'select') return;
      col.options = [...(col.options ?? []), { id, label: label.trim(), tone: TONE_BY_INDEX[(col.options?.length ?? 0) % 3] }];
    });
    return id;
  };

  const groupCol = db.columns.find((c) => c.id === db.groupByColumnId && c.type === 'select')
    ?? db.columns.find((c) => c.type === 'select') ?? null;
  const dateCol = db.columns.find((c) => c.id === db.calendarColumnId && c.type === 'date')
    ?? db.columns.find((c) => c.type === 'date') ?? null;

  const firstColId = db.columns[0]?.id;

  return (
    <div className="dbwrap">
      {/* encabezado editable */}
      <div className="titlerow" style={{ marginBottom: 14 }}>
        <div className="titleicon" aria-hidden="true" style={{ width: 44, height: 44 }}>
          <Icon name="database" size={22} />
        </div>
        <input
          className="titleinput"
          style={{ fontSize: '30px', flex: 1, minWidth: 0 }}
          value={page.title}
          placeholder="Base de datos sin título"
          aria-label="Nombre de la base de datos"
          onChange={(e) => updatePage(page.id, { title: e.target.value })}
        />
        <button className="rowaction" style={{ marginTop: 10 }} title={page.favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'} onClick={() => toggleFavorite(page.id)} aria-label="Alternar favorito">
          <Icon name="star" size={16} filled={page.favorite} />
        </button>
        <button className="rowaction" style={{ marginTop: 10 }} title="Mover a la papelera" onClick={() => trashPage(page.id)} aria-label="Mover base de datos a la papelera">
          <Icon name="trash" size={16} />
        </button>
      </div>

      {/* selector de vista + herramientas */}
      <div className="dbhead">
        <div className="viewtabs" role="tablist" aria-label="Vistas de la base de datos">
          {([
            { v: 'table' as DBView, label: 'Tabla', icon: 'table' as IconName },
            { v: 'board' as DBView, label: 'Tablero', icon: 'board' as IconName },
            { v: 'calendar' as DBView, label: 'Calendario', icon: 'calendar' as IconName },
            { v: 'chart' as DBView, label: 'Gráfico', icon: 'chart' as IconName },
            { v: 'gallery' as DBView, label: 'Galería', icon: 'gallery' as IconName },
          ]).map(({ v, label, icon }) => (
            <button key={v} role="tab" aria-selected={db.view === v}
              className={`viewtab${db.view === v ? ' is-active' : ''}`} onClick={() => setView(v)}>
              <Icon name={icon} size={15} /> {label}
            </button>
          ))}
        </div>
        <div className="dbtools">
          <div className="dbfilter-wrap">
            <Icon name="filter" size={13} />
            <input
              className="dbfilter"
              placeholder="Filtrar filas…"
              value={db.filter}
              onChange={(e) => mutate((d) => { d.filter = e.target.value; })}
              aria-label="Filtrar filas"
            />
          </div>
          {db.view === 'board' && db.columns.filter((c) => c.type === 'select').length > 0 && (
            <select
              className="dbselect"
              value={groupCol?.id ?? ''}
              onChange={(e) => mutate((d) => { d.groupByColumnId = e.target.value; })}
              aria-label="Agrupar tablero por columna"
            >
              {db.columns.filter((c) => c.type === 'select').map((c) => (
                <option key={c.id} value={c.id}>Agrupar: {c.name}</option>
              ))}
            </select>
          )}
          <div className="addprop" ref={addPropRef}>
            <button className="btn-ghost" onClick={() => setAddPropOpen((v) => !v)} aria-expanded={addPropOpen} aria-haspopup="menu">
              + Propiedad
            </button>
            {addPropOpen && (
              <div className="addprop__menu" role="menu">
                {([
                  ['text', 'Texto', 'text'],
                  ['number', 'Número', 'sort'],
                  ['select', 'Selección', 'toggle'],
                  ['date', 'Fecha', 'calendar'],
                  ['checkbox', 'Casilla', 'checkSquare'],
                ] as [PropertyType, string, IconName][]).map(([type, label, icon]) => (
                  <button key={type} role="menuitem" onClick={() => addColumn(type)}>
                    <Icon name={icon} size={15} /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VISTA TABLA */}
      {db.view === 'table' && (
        <div className="dbtable-wrap">
          <table className="dbtable" aria-label="Tabla de la base de datos">
            <thead>
              <tr>
                {db.columns.map((col) => (
                  <th key={col.id}>
                    {renamingCol === col.id ? (
                      <input
                        className="cellinput"
                        autoFocus
                        defaultValue={col.name}
                        onBlur={(e) => { renameColumn(col.id, e.target.value); setRenamingCol(null); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setRenamingCol(null);
                        }}
                        aria-label="Renombrar columna"
                      />
                    ) : (
                      <>
                        <button
                          className="thsort"
                          onClick={() => mutate((d) => {
                            if (d.sortColumnId === col.id) {
                              d.sortDir = d.sortDir === 'asc' ? 'desc' : 'asc';
                            } else {
                              d.sortColumnId = col.id;
                              d.sortDir = 'asc';
                            }
                          })}
                          onDoubleClick={() => setRenamingCol(col.id)}
                          title="Ordenar · doble clic para renombrar"
                        >
                          {col.name}
                          {db.sortColumnId === col.id && (
                            <Icon name={db.sortDir === 'asc' ? 'chevronUp' : 'chevronDown'} size={11} />
                          )}
                        </button>
                        {db.columns.length > 1 && (
                          <button className="coldel" title="Eliminar columna" aria-label={`Eliminar columna ${col.name}`} onClick={() => deleteColumn(col.id)}>
                            <Icon name="x" size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </th>
                ))}
                <th aria-label="Acciones de fila" style={{ width: 34 }} />
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr><td colSpan={db.columns.length + 1} style={{ textAlign: 'center', padding: '26px 12px', color: 'var(--ink-55)' }}>
                  {db.filter ? `Ninguna fila coincide con “${db.filter}”.` : 'Aún no hay filas — añade la primera abajo.'}
                </td></tr>
              )}
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  {db.columns.map((col) => {
                    const cellKey = `${row.id}:${col.id}`;
                    if (col.type === 'select') {
                      const opt = col.options?.find((o) => o.id === row.cells[col.id]);
                      return (
                        <td key={col.id} style={{ position: 'relative' }}>
                          <button className="pill" data-tone={opt?.tone ?? 'ink'} onClick={() => setOpenCell(openCell === cellKey ? null : cellKey)}>
                            <i />{opt?.label ?? 'Elegir…'}
                          </button>
                          {openCell === cellKey && (
                            <div className="cellopts" ref={cellPopRef} role="listbox" aria-label={`Elegir ${col.name}`}>
                              {col.options?.map((o) => (
                                <button key={o.id} role="option" onClick={() => { setCell(row.id, col.id, o.id); setOpenCell(null); }}>
                                  <span className="pill" data-tone={o.tone} style={{ pointerEvents: 'none' }}><i />{o.label}</span>
                                </button>
                              ))}
                              <div className="newopt">
                                <input
                                  value={newOption}
                                  placeholder="Nueva opción…"
                                  onChange={(e) => setNewOption(e.target.value)}
                                  aria-label="Nueva opción de selección"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newOption.trim()) {
                                      const id = addSelectOption(col.id, newOption);
                                      setCell(row.id, col.id, id);
                                      setNewOption('');
                                      setOpenCell(null);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    }
                    if (col.type === 'checkbox') {
                      return (
                        <td key={col.id}>
                          <input
                            className="cellinput"
                            type="checkbox"
                            checked={!!row.cells[col.id]}
                            onChange={(e) => setCell(row.id, col.id, e.target.checked)}
                            aria-label={col.name}
                          />
                        </td>
                      );
                    }
                    if (col.type === 'date') {
                      return (
                        <td key={col.id}>
                          <input
                            className="celldate"
                            type="date"
                            value={String(row.cells[col.id] ?? '')}
                            onChange={(e) => setCell(row.id, col.id, e.target.value)}
                            aria-label={col.name}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={col.id}>
                        <input
                          className="cellinput"
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={String(row.cells[col.id] ?? '')}
                          onChange={(e) =>
                            setCell(row.id, col.id, col.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)
                          }
                          aria-label={col.name}
                        />
                      </td>
                    );
                  })}
                  <td>
                    <button className="rowdel" title="Eliminar fila" aria-label="Eliminar fila" onClick={() => deleteRow(row.id)}>
                      <Icon name="x" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="addrow">
            <button onClick={() => addRow()}><Icon name="plus" size={13} /> Nueva fila</button>
          </div>
        </div>
      )}

      {/* VISTA TABLERO */}
      {db.view === 'board' && groupCol && (
        <div className="board" role="list" aria-label="Tablero agrupado por estado">
          {[...(groupCol.options ?? []), { id: '__none__', label: 'Sin estado', tone: 'ink' as const }].map((opt) => {
            const rows = filteredRows.filter((r) =>
              opt.id === '__none__' ? !r.cells[groupCol.id] : r.cells[groupCol.id] === opt.id,
            );
            return (
              <div
                key={opt.id}
                role="listitem"
                className={`bcol${overCol === opt.id ? ' is-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setOverCol(opt.id); }}
                onDragLeave={() => setOverCol((c) => (c === opt.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = dragRow.current;
                  if (id) setCell(id, groupCol.id, opt.id === '__none__' ? null : opt.id);
                  dragRow.current = null;
                  setOverCol(null);
                }}
              >
                <div className="bcol__head">
                  <span className="pill" data-tone={opt.tone}><i />{opt.label}</span>
                  <span className="bcol__count">{rows.length}</span>
                </div>
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="bcard"
                    draggable
                    onDragStart={() => { dragRow.current = row.id; }}
                    onDragEnd={() => { dragRow.current = null; setOverCol(null); }}
                    aria-label={`Tarjeta ${String(row.cells[firstColId ?? ''] ?? row.id)}`}
                  >
                    <span className="bcard__name">{String(row.cells[firstColId ?? ''] ?? 'Sin título')}</span>
                    <span className="bcard__meta">
                      {db.columns.filter((c) => c.type === 'select' && c.id !== groupCol.id).slice(0, 1).map((c) => {
                        const o = c.options?.find((x) => x.id === row.cells[c.id]);
                        return o ? <span key={c.id} className="pill" data-tone={o.tone}><i />{o.label}</span> : null;
                      })}
                      {dateCol && row.cells[dateCol.id] && (
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(row.cells[dateCol.id])}</span>
                      )}
                      <button className="rowdel" style={{ visibility: 'visible', marginLeft: 'auto' }} title="Eliminar fila" aria-label="Eliminar fila"
                        onClick={() => deleteRow(row.id)}>
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  </div>
                ))}
                <button className="addrow" style={{ background: 'none', border: 'none', padding: '4px 2px' }}
                  onClick={() => addRow(opt.id === '__none__' ? {} : { [groupCol.id]: opt.id })}>
                  <Icon name="plus" size={12} /> Añadir
                </button>
              </div>
            );
          })}
        </div>
      )}
      {db.view === 'board' && !groupCol && (
        <p style={{ color: 'var(--ink-55)', padding: '30px 8px' }}>Añade una propiedad de Selección para agrupar este tablero en columnas.</p>
      )}

      {/* VISTA CALENDARIO */}
      {db.view === 'calendar' && (
        <CalendarView
          db={db}
          dateCol={dateCol}
          monthOffset={monthOffset}
          setMonthOffset={setMonthOffset}
          onAdd={(iso) => addRow(dateCol ? { [dateCol.id]: iso } : {})}
        />
      )}

      {/* VISTA GRÁFICO */}
      {db.view === 'chart' && <ChartView db={db} mutate={mutate} />}

      {/* VISTA GALERÍA */}
      {db.view === 'gallery' && (
        <GalleryView
          db={db}
          firstColId={firstColId ?? db.columns[0]?.id ?? ''}
          onAdd={() => addRow()}
          onDelete={deleteRow}
          setCell={setCell}
        />
      )}

      <p style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-38)' }}>
        {db.rows.length} {db.rows.length === 1 ? 'fila' : 'filas'} · guardado localmente{db.filter.trim() ? ' · filtrado' : ''}
      </p>
    </div>
  );
}

type ChartPoint = { key: string; label: string; value: number; tone: 'sage' | 'terra' | 'ink' };

const CHART_KINDS: { id: ChartKind; label: string; icon: IconName }[] = [
  { id: 'bar', label: 'Barras', icon: 'chart' },
  { id: 'horizontal', label: 'Horizontal', icon: 'sort' },
  { id: 'line', label: 'Líneas', icon: 'chartLine' },
  { id: 'donut', label: 'Donut', icon: 'chartDonut' },
];

function toneColor(tone: ChartPoint['tone']): string {
  if (tone === 'sage') return 'var(--sage)';
  if (tone === 'terra') return 'var(--terra)';
  return 'var(--ink-70, var(--ink))';
}

function ChartView({
  db,
  mutate,
}: {
  db: NonNullable<Page['db']>;
  mutate: (fn: (draft: NonNullable<Page['db']>) => void) => void;
}) {
  const candidates = useMemo(
    () => db.columns.filter((c) => c.type === 'select' || c.type === 'date' || c.type === 'checkbox' || c.type === 'text'),
    [db.columns],
  );
  const numeric = useMemo(() => db.columns.filter((c) => c.type === 'number'), [db.columns]);
  const axis =
    candidates.find((c) => c.id === db.chartColumnId)
    ?? candidates.find((c) => c.type === 'select')
    ?? candidates.find((c) => c.type === 'date')
    ?? candidates.find((c) => c.type === 'checkbox')
    ?? candidates[0]
    ?? null;
  const metricCol = numeric.find((c) => c.id === db.chartMetricColumnId) ?? null;
  const metricOp = db.chartMetricOp ?? 'sum';
  const kind = db.chartKind ?? 'bar';

  const aggregate = (rows: DBRow[]): number => {
    if (!metricCol) return rows.length;
    const sum = rows.reduce((acc, row) => {
      const raw = row.cells[metricCol.id];
      return acc + (typeof raw === 'number' ? raw : Number(raw ?? 0) || 0);
    }, 0);
    if (metricOp === 'avg' && rows.length > 0) return sum / rows.length;
    return sum;
  };

  const points = useMemo<ChartPoint[]>(() => {
    if (!axis) return [];
    if (axis.type === 'select') {
      const out: ChartPoint[] = (axis.options ?? []).map((o) => ({
        key: o.id,
        label: o.label,
        value: aggregate(db.rows.filter((r) => r.cells[axis.id] === o.id)),
        tone: o.tone,
      }));
      const none = db.rows.filter((r) => !r.cells[axis.id]);
      if (none.length > 0) out.push({ key: '__none__', label: 'Sin valor', value: aggregate(none), tone: 'ink' });
      return out;
    }
    if (axis.type === 'checkbox') {
      return [
        { key: 'yes', label: 'Hecho', value: aggregate(db.rows.filter((r) => !!r.cells[axis.id])), tone: 'sage' },
        { key: 'no', label: 'Pendiente', value: aggregate(db.rows.filter((r) => !r.cells[axis.id])), tone: 'ink' },
      ];
    }
    if (axis.type === 'date') {
      const now = new Date();
      const months: { key: string; label: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleString('es', { month: 'short' }),
        });
      }
      return months.map((m) => ({
        key: m.key,
        label: m.label,
        value: aggregate(db.rows.filter((r) => typeof r.cells[axis.id] === 'string' && String(r.cells[axis.id]).startsWith(m.key))),
        tone: 'terra',
      }));
    }
    const groups = new Map<string, DBRow[]>();
    for (const row of db.rows) {
      const raw = row.cells[axis.id];
      const label = String(raw ?? '').trim() || 'Sin valor';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(row);
    }
    const ordered = [...groups.entries()]
      .map(([label, rows], index) => ({
        key: label,
        label,
        rows,
        value: aggregate(rows),
        tone: (['ink', 'terra', 'sage'] as const)[index % 3],
      }))
      .sort((a, b) => b.value - a.value);
    const top: ChartPoint[] = ordered.slice(0, 8).map(({ key, label, value, tone }) => ({ key, label, value, tone }));
    if (ordered.length > 8) {
      top.push({
        key: '__other__',
        label: 'Otros',
        value: aggregate(ordered.slice(8).flatMap((x) => x.rows)),
        tone: 'ink',
      });
    }
    return top;
  }, [axis, db.rows, metricCol, metricOp]);

  if (candidates.length === 0) {
    return (
      <p style={{ color: 'var(--ink-55)', padding: '30px 8px' }}>
        Añade una propiedad de <b>Selección</b>, <b>Fecha</b>, <b>Casilla</b> o <b>Texto</b> para graficar los datos.
      </p>
    );
  }

  const total = points.reduce((acc, p) => acc + p.value, 0);
  const max = Math.max(1, ...points.map((p) => p.value));
  const avg = points.length > 0 ? total / points.length : 0;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const valueLabel = metricCol
    ? `${metricOp === 'avg' ? 'Media' : 'Suma'} de ${metricCol.name}`
    : 'Recuento de filas';

  const W = 820;
  const H = 300;
  const PT = 28;
  const PB = 48;
  const barPL = 14;
  const barPR = 14;
  const innerH = H - PT - PB;

  const setMetric = (value: string) => {
    mutate((d) => {
      if (value === 'count') {
        d.chartMetricColumnId = null;
      } else {
        const [op, id] = value.split(':');
        d.chartMetricOp = op as 'sum' | 'avg';
        d.chartMetricColumnId = id;
      }
    });
  };

  return (
    <div className="chartwrap">
      <div className="charttools">
        <div className="charttool">
          <span className="charttools__label">Agrupar por</span>
          <select
            className="dbselect"
            value={axis?.id ?? ''}
            onChange={(e) => mutate((d) => { d.chartColumnId = e.target.value; })}
            aria-label="Columna para agrupar el gráfico"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="charttool">
          <span className="charttools__label">Valor</span>
          <select
            className="dbselect"
            value={metricCol ? `${metricOp}:${metricCol.id}` : 'count'}
            onChange={(e) => setMetric(e.target.value)}
            aria-label="Qué valor mostrar en el gráfico"
          >
            <option value="count">Recuento de filas</option>
            {numeric.map((c) => (
              <option key={`sum-${c.id}`} value={`sum:${c.id}`}>Suma de {c.name}</option>
            ))}
            {numeric.map((c) => (
              <option key={`avg-${c.id}`} value={`avg:${c.id}`}>Media de {c.name}</option>
            ))}
          </select>
        </div>
        <div className="chartkinds" role="tablist" aria-label="Tipo de gráfico">
          {CHART_KINDS.map((k) => (
            <button
              key={k.id}
              role="tab"
              aria-selected={kind === k.id}
              className={kind === k.id ? 'is-active' : ''}
              onClick={() => mutate((d) => { d.chartKind = k.id; })}
            >
              <Icon name={k.icon} size={14} /> {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chartstats">
        <div><b>{fmt(total)}</b><span>Total</span></div>
        <div><b>{fmt(max)}</b><span>Máximo</span></div>
        <div><b>{fmt(avg)}</b><span>Media por grupo</span></div>
        <div><b>{points.length}</b><span>Grupos</span></div>
      </div>

      {points.length === 0 ? (
        <p className="chartempty">Aún no hay datos que dibujar.</p>
      ) : kind === 'donut' ? (
        <div className="donutwrap">
          <svg className="donutchart" viewBox="0 0 280 280" role="img" aria-label={`Gráfico donut de ${axis?.name ?? ''}`}>
            <circle cx="140" cy="140" r="92" fill="none" stroke="var(--line-soft)" strokeWidth="30" />
            {(() => {
              let offset = 0;
              return points.map((p) => {
                const pct = total > 0 ? p.value / total : 0;
                const dash = pct * 100;
                const el = (
                  <circle
                    key={p.key}
                    cx="140"
                    cy="140"
                    r="92"
                    fill="none"
                    stroke={toneColor(p.tone)}
                    strokeWidth="30"
                    pathLength={100}
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 140 140)"
                  >
                    <title>{`${p.label}: ${fmt(p.value)}`}</title>
                  </circle>
                );
                offset += dash;
                return el;
              });
            })()}
            <text x="140" y="134" textAnchor="middle" className="donuttotal">{fmt(total)}</text>
            <text x="140" y="156" textAnchor="middle" className="donutcap">{metricCol ? metricCol.name : 'filas'}</text>
          </svg>
          <ul className="donutlegend">
            {points.map((p) => (
              <li key={p.key}>
                <i style={{ background: toneColor(p.tone) }} />
                <span className="donutlegend__name">{p.label}</span>
                <span className="donutlegend__value">{fmt(p.value)}</span>
                <span className="donutlegend__pct">{total > 0 ? Math.round((p.value / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : kind === 'line' ? (
        <svg className="chartsvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de líneas de ${axis?.name ?? ''}`}>
          {[0.25, 0.5, 0.75].map((f, i) => {
            const y = PT + innerH * (1 - f);
            return <line key={i} x1={barPL} x2={W - barPR} y1={y} y2={y} stroke="var(--line-soft)" strokeDasharray="2 5" />;
          })}
          <line x1={barPL} x2={W - barPR} y1={PT + innerH} y2={PT + innerH} stroke="var(--line)" />
          {(() => {
            const slot = (W - barPL - barPR) / Math.max(1, points.length);
            const coords = points.map((p, i) => ({
              x: barPL + slot * i + slot / 2,
              y: PT + innerH - (p.value / max) * innerH,
              p,
            }));
            const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x} ${c.y}`).join(' ');
            const area = `${path} L ${coords[coords.length - 1].x} ${PT + innerH} L ${coords[0].x} ${PT + innerH} Z`;
            return (
              <>
                <path d={area} fill="color-mix(in oklab, var(--terra) 14%, transparent)" stroke="none" />
                <path d={path} fill="none" stroke="var(--terra)" strokeWidth="2.2" strokeLinejoin="round" />
                {coords.map((c) => (
                  <g key={c.p.key}>
                    <title>{`${c.p.label}: ${fmt(c.p.value)}`}</title>
                    <circle cx={c.x} cy={c.y} r="4.2" fill="var(--paper)" stroke="var(--terra)" strokeWidth="2" />
                    {c.p.value > 0 && <text x={c.x} y={c.y - 11} textAnchor="middle" className="chartval">{fmt(c.p.value)}</text>}
                    <text x={c.x} y={PT + innerH + 19} textAnchor="middle" className="chartlab">{c.p.label.length > 14 ? c.p.label.slice(0, 13) + '…' : c.p.label}</text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
      ) : kind === 'horizontal' ? (
        <svg className="chartsvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico horizontal de ${axis?.name ?? ''}`}>
          {[0.25, 0.5, 0.75].map((f, i) => {
            const x = 170 + (W - 230) * f;
            return <line key={i} x1={x} x2={x} y1={PT} y2={PT + innerH} stroke="var(--line-soft)" strokeDasharray="2 5" />;
          })}
          {(() => {
            const labelW = 158;
            const barW = W - labelW - 60;
            const rowH = innerH / Math.max(1, points.length);
            return points.map((p, i) => {
              const y = PT + i * rowH + rowH * 0.2;
              const h = Math.max(8, Math.min(26, rowH * 0.58));
              const w = (p.value / max) * barW;
              return (
                <g key={p.key}>
                  <title>{`${p.label}: ${fmt(p.value)}`}</title>
                  <text x={labelW - 10} y={y + h * 0.7} textAnchor="end" className="chartlab">{p.label.length > 20 ? p.label.slice(0, 19) + '…' : p.label}</text>
                  <rect x={labelW} y={y} width={Math.max(2, w)} height={h} rx={4} fill={toneColor(p.tone)} opacity={p.value > 0 ? 1 : 0.25} />
                  <text x={labelW + w + 8} y={y + h * 0.7} className="chartval">{fmt(p.value)}</text>
                </g>
              );
            });
          })()}
        </svg>
      ) : (
        <svg className="chartsvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de barras de ${axis?.name ?? ''}`}>
          {[0.25, 0.5, 0.75].map((f, i) => {
            const y = PT + innerH * (1 - f);
            return <line key={i} x1={barPL} x2={W - barPR} y1={y} y2={y} stroke="var(--line-soft)" strokeDasharray="2 5" />;
          })}
          <line x1={barPL} x2={W - barPR} y1={PT + innerH} y2={PT + innerH} stroke="var(--line)" />
          {(() => {
            const innerW = W - barPL - barPR;
            const slot = innerW / Math.max(1, points.length);
            const barW = Math.min(78, slot * 0.62);
            return points.map((p, i) => {
              const h = (p.value / max) * innerH;
              const x = barPL + i * slot + (slot - barW) / 2;
              const y = PT + innerH - h;
              return (
                <g key={p.key} className="chartbar">
                  <title>{`${p.label}: ${fmt(p.value)}`}</title>
                  <rect x={x} y={y} width={barW} height={Math.max(h, p.value > 0 ? 3 : 2)} rx={5} fill={toneColor(p.tone)} opacity={p.value > 0 ? 1 : 0.25} />
                  {p.value > 0 && <text x={x + barW / 2} y={y - 8} textAnchor="middle" className="chartval">{fmt(p.value)}</text>}
                  <text x={x + barW / 2} y={PT + innerH + 20} textAnchor="middle" className="chartlab">{p.label.length > 14 ? p.label.slice(0, 13) + '…' : p.label}</text>
                </g>
              );
            });
          })()}
        </svg>
      )}

      <p className="chartfoot">
        {points.length} {points.length === 1 ? 'grupo' : 'grupos'} · eje: {axis?.name} · {valueLabel} · guardado localmente
      </p>
    </div>
  );
}

function GalleryView({
  db,
  firstColId,
  onAdd,
  onDelete,
  setCell,
}: {
  db: NonNullable<Page['db']>;
  firstColId: string;
  onAdd: () => void;
  onDelete: (rowId: string) => void;
  setCell: (rowId: string, colId: string, value: DBRow['cells'][string]) => void;
}) {
  const first = db.columns.find((c) => c.id === firstColId);
  const selectCols = db.columns.filter((c) => c.type === 'select');
  const showProps = db.columns.filter((c) => c.id !== firstColId).slice(0, 4);

  return (
    <div className="gallerywrap">
      <div className="gallerygrid">
        {db.rows.map((row) => {
          const tone = selectCols
            .map((c) => c.options?.find((o) => o.id === row.cells[c.id]))
            .find(Boolean)?.tone;
          return (
            <article key={row.id} className="gcard">
              <div className={`gcard__band${tone ? ` tone-${tone}` : ''}`}>
                <Icon name="doc" size={18} />
              </div>
              <div className="gcard__body">
                <input
                  className="gcard__title"
                  value={String(row.cells[firstColId] ?? '')}
                  placeholder={first?.name ?? 'Sin título'}
                  aria-label={first?.name ?? 'Título de la tarjeta'}
                  onChange={(e) => setCell(row.id, firstColId, e.target.value)}
                />
                <div className="gcard__props">
                  {showProps.map((col) => {
                    const value = row.cells[col.id];
                    if (col.type === 'select') {
                      const opt = col.options?.find((o) => o.id === value);
                      return opt ? (
                        <span key={col.id} className="pill" data-tone={opt.tone}><i />{opt.label}</span>
                      ) : null;
                    }
                    if (col.type === 'checkbox') {
                      return (
                        <span key={col.id} className={`gcard__bool${value ? ' is-on' : ''}`}>
                          <Icon name={value ? 'check' : 'x'} size={10} /> {col.name}
                        </span>
                      );
                    }
                    if (value === null || value === undefined || value === '') return null;
                    return <span key={col.id} className="gcard__prop">{col.name}: {String(value)}</span>;
                  })}
                </div>
              </div>
              <button className="rowdel" title="Eliminar tarjeta" aria-label="Eliminar tarjeta" onClick={() => onDelete(row.id)}>
                <Icon name="x" size={13} />
              </button>
            </article>
          );
        })}
        <button className="gcard gcard--add" onClick={onAdd}>
          <Icon name="plus" size={16} />
          <span>Nueva tarjeta</span>
        </button>
      </div>
    </div>
  );
}

function CalendarView({
  db,
  dateCol,
  monthOffset,
  setMonthOffset,
  onAdd,
}: {
  db: NonNullable<Page['db']>;
  dateCol: DBColumn | null;
  monthOffset: number;
  setMonthOffset: (fn: (n: number) => number) => void;
  onAdd: (iso: string) => void;
}) {
  const base = new Date();
  const cursor = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleString('es', { month: 'long', year: 'numeric' });

  const pad = (n: number) => String(n).padStart(2, '0');
  const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const cells: { iso: string; day: number; inMonth: boolean; today: boolean }[] = [];
  const todayISO = localISO(new Date());
  // semana empezando en lunes
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - firstDow + i);
    const iso = localISO(d);
    cells.push({
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      today: iso === todayISO,
    });
  }

  const byDate = new Map<string, DBRow[]>();
  if (dateCol) {
    for (const r of db.rows) {
      const v = r.cells[dateCol.id];
      if (typeof v === 'string' && v) {
        if (!byDate.has(v)) byDate.set(v, []);
        byDate.get(v)!.push(r);
      }
    }
  }

  const weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  return (
    <div className="cal">
      <div className="cal__nav">
        <button className="iconbtn" onClick={() => setMonthOffset((n) => n - 1)} aria-label="Mes anterior"><span className="flip"><Icon name="chevronRight" size={15} /></span></button>
        <span className="cal__title">{monthName}</span>
        <button className="iconbtn" onClick={() => setMonthOffset((n) => n + 1)} aria-label="Mes siguiente"><Icon name="chevronRight" size={15} /></button>
        <button className="btn-ghost" onClick={() => setMonthOffset(() => 0)}>Hoy</button>
        {!dateCol && <span className="errormsg">Añade una propiedad de Fecha para fijar filas en el calendario.</span>}
      </div>
      <div className="cal__grid" role="grid" aria-label="Calendario">
        {weekdays.map((d) => (
          <div key={d} className="cal__dow">{d}</div>
        ))}
        {cells.map((c) => {
          const rows = byDate.get(c.iso) ?? [];
          return (
            <button
              key={c.iso}
              className={`cal__cell${c.inMonth ? '' : ' is-dim'}${c.today ? ' is-today' : ''}`}
              onClick={() => onAdd(c.iso)}
              aria-label={`Añadir fila el ${c.iso}`}
            >
              <span className="cal__day">{c.day}</span>
              {rows.map((r) => (
                <span key={r.id} className="cal__chip" title={String(r.cells['c-name'] ?? r.cells[Object.keys(r.cells)[0] ?? ''] ?? 'Sin título')}>
                  {String(r.cells['c-name'] ?? r.cells[Object.keys(r.cells)[0] ?? ''] ?? 'Sin título')}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
