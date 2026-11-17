import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';
import { newId, type DBColumn, type DBRow, type DBView, type Page, type PropertyType } from '../lib/types';

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
      {db.view === 'chart' && <ChartView db={db} />}

      <p style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-38)' }}>
        {db.rows.length} {db.rows.length === 1 ? 'fila' : 'filas'} · guardado localmente{db.filter.trim() ? ' · filtrado' : ''}
      </p>
    </div>
  );
}

function ChartView({ db }: { db: NonNullable<Page['db']> }) {
  const candidates = useMemo(
    () => [
      ...db.columns.filter((c) => c.type === 'select'),
      ...db.columns.filter((c) => c.type === 'date'),
    ],
    [db.columns],
  );
  const [axisId, setAxisId] = useState<string>(() => candidates[0]?.id ?? '');
  const axis = candidates.find((c) => c.id === axisId) ?? candidates[0];

  const data = useMemo((): { label: string; value: number; tone?: 'sage' | 'terra' | 'ink' }[] => {
    if (!axis) return [];
    if (axis.type === 'select') {
      const counts = new Map<string, number>();
      for (const r of db.rows) {
        const v = r.cells[axis.id];
        const key = typeof v === 'string' && v ? v : '__none__';
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const arr = (axis.options ?? []).map((o) => ({ label: o.label, value: counts.get(o.id) ?? 0, tone: o.tone }));
      const none = counts.get('__none__') ?? 0;
      if (none > 0) arr.push({ label: 'Sin valor', value: none, tone: 'ink' as const });
      return arr;
    }
    // serie por mes (últimos 6 meses)
    const nowD = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('es', { month: 'short' }),
      });
    }
    const counts = new Map<string, number>();
    for (const r of db.rows) {
      const v = r.cells[axis.id];
      if (typeof v === 'string' && v) {
        const key = v.slice(0, 7);
        if (months.some((m) => m.key === key)) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
  }, [db.rows, axis]);

  if (candidates.length === 0) {
    return (
      <p style={{ color: 'var(--ink-55)', padding: '30px 8px' }}>
        Añade una propiedad de <b>Selección</b> o <b>Fecha</b> para graficar los datos.
      </p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 760, H = 250, PT = 26, PB = 46, PL = 8, PR = 8;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(78, slot * 0.62);
  const total = data.reduce((a, d) => a + d.value, 0);

  const barFill = (tone?: 'sage' | 'terra' | 'ink') =>
    tone === 'sage' ? 'var(--sage)' : tone === 'terra' ? 'var(--terra)' : tone === 'ink' ? 'var(--ink-70, var(--ink))' : 'var(--terra)';

  return (
    <div className="chartwrap">
      <div className="charttools">
        <span className="charttools__label">Agrupar por</span>
        <select
          className="dbselect"
          value={axis?.id ?? ''}
          onChange={(e) => setAxisId(e.target.value)}
          aria-label="Columna para agrupar el gráfico"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <svg className="chartsvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de barras de ${axis?.name ?? ''}`}>
        {[0.25, 0.5, 0.75].map((f, i) => {
          const y = PT + innerH * (1 - f);
          return <line key={i} x1={PL} x2={W - PR} y1={y} y2={y} stroke="var(--line-soft)" strokeDasharray="2 5" />;
        })}
        <line x1={PL} x2={W - PR} y1={PT + innerH} y2={PT + innerH} stroke="var(--line)" />
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = PL + i * slot + (slot - barW) / 2;
          const y = PT + innerH - h;
          const fill = barFill(d.tone);
          return (
            <g key={i} className="chartbar">
              <title>{`${d.label}: ${d.value} ${d.value === 1 ? 'fila' : 'filas'}`}</title>
              <rect x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 3 : 2)} rx={5} fill={fill} opacity={d.value > 0 ? 1 : 0.25} />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 7} textAnchor="middle" className="chartval">{d.value}</text>
              )}
              <text x={x + barW / 2} y={PT + innerH + 18} textAnchor="middle" className="chartlab">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <p className="chartfoot">{total} {total === 1 ? 'fila' : 'filas'} en el gráfico · eje: {axis?.name}</p>
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
