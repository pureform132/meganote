import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';
import {
  ALL_TAG_COLORS, newId,
  type CellValue, type DBColumn, type DBRow, type DBState, type DBView, type NumberFormat,
  type Page, type PropertyType, type SelectOption, type TagColor,
} from '../lib/types';
import {
  cellText, convertColumn, formatNumberCell, nextColor,
  NUMBER_FORMATS, NUMBER_PRECISIONS,
} from '../lib/dbcell';

const TYPES: { type: PropertyType; label: string; icon: IconName }[] = [
  { type: 'text', label: 'Texto', icon: 'text' },
  { type: 'number', label: 'Número', icon: 'hash' },
  { type: 'select', label: 'Selección', icon: 'dot' },
  { type: 'multi_select', label: 'Selección múltiple', icon: 'tags' },
  { type: 'date', label: 'Fecha', icon: 'calendar' },
  { type: 'checkbox', label: 'Casilla', icon: 'checkSquare' },
  { type: 'url', label: 'URL', icon: 'link' },
  { type: 'email', label: 'Correo', icon: 'mail' },
  { type: 'phone', label: 'Teléfono', icon: 'phone' },
];

function cloneDB<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function DatabaseView({ page }: { page: Page }) {
  const { updateDB, updatePage, toggleFavorite, trashPage, byId, createPage, setActivePageId } = useWorkspace();
  const db = page.db!;
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [openCell, setOpenCell] = useState<string | null>(null); // `${rowId}:${colId}`
  const [menuCol, setMenuCol] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [paletteFor, setPaletteFor] = useState<string | null>(null); // opción abriendo su paleta
  const [coverRow, setCoverRow] = useState<string | null>(null); // fila con el editor de portada abierto
  const [coverUrl, setCoverUrl] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [newOption, setNewOption] = useState('');
  const addPropRef = useRef<HTMLDivElement>(null);
  const cellPopRef = useRef<HTMLDivElement>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const coverPopRef = useRef<HTMLDivElement>(null);
  const dragRow = useRef<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (addPropOpen && !addPropRef.current?.contains(t)) setAddPropOpen(false);
      if (openCell && !cellPopRef.current?.contains(t) && !t.closest('.pill')) setOpenCell(null);
      if (menuCol && !colMenuRef.current?.contains(t) && !t.closest('.thname')) {
        setMenuCol(null);
        setPaletteFor(null);
      }
      if (coverRow && !coverPopRef.current?.contains(t) && !t.closest('.gcard__coverbtn')) {
        setCoverRow(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [addPropOpen, openCell, menuCol]);

  const mutate = (fn: (draft: DBState) => void, tag?: string) =>
    updateDB(page.id, (d) => {
      const draft = cloneDB(d);
      fn(draft);
      return draft;
    }, tag ?? null);

  const setView = (view: DBView) => mutate((d) => { d.view = view; }, `view:${view}`);

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
        if (col?.type === 'number') return (Number(av ?? -Infinity) - Number(bv ?? -Infinity)) * dir;
        if (col?.type === 'checkbox') return (Number(!!av) - Number(!!bv)) * dir;
        const an = Array.isArray(av) ? av.join(',') : av == null ? '' : String(av);
        const bn = Array.isArray(bv) ? bv.join(',') : bv == null ? '' : String(bv);
        return an.localeCompare(bn, 'es') * dir;
      });
    }
    return rows;
  }, [db]);

  const addRow = (preset?: Record<string, CellValue>) => {
    const id = newId();
    mutate((d) => {
      const cells: DBRow['cells'] = {};
      for (const c of d.columns) cells[c.id] = c.type === 'checkbox' ? false : null;
      Object.assign(cells, preset ?? {});
      d.rows.push({ id, cells });
    }, `row:${id}`);
    return id;
  };

  const setCell = (rowId: string, colId: string, value: CellValue) =>
    mutate((d) => {
      const row = d.rows.find((r) => r.id === rowId);
      if (row) row.cells[colId] = value;
    }, `cell:${rowId}:${colId}`);

  const deleteRow = (rowId: string) => mutate((d) => { d.rows = d.rows.filter((r) => r.id !== rowId); }, `rowdel:${rowId}`);

  const addColumn = (type: PropertyType) => {
    const labels: Record<PropertyType, string> = {
      text: 'Propiedad', number: 'Número', select: 'Selección', multi_select: 'Selección múlt.',
      date: 'Fecha', checkbox: 'Casilla', url: 'URL', email: 'Correo', phone: 'Teléfono',
    };
    mutate((d) => {
      const base: DBColumn = { id: newId(), name: labels[type], type };
      if (type === 'select' || type === 'multi_select') {
        base.options = [
          { id: newId(), label: 'Opción A', color: nextColor(0) },
          { id: newId(), label: 'Opción B', color: nextColor(1) },
        ];
      }
      d.columns.push(base);
    }, `coladd:${type}`);
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
    }, `coldel:${colId}`);

  const renameColumn = (colId: string, name: string) =>
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (col && name.trim()) col.name = name.trim();
    }, `colren:${colId}`);

  const changeColumnType = (colId: string, to: PropertyType) =>
    mutate((d) => { convertColumn(d, colId, to); }, `coltype:${colId}:${to}`);

  const duplicateColumn = (colId: string) =>
    mutate((d) => {
      const i = d.columns.findIndex((c) => c.id === colId);
      if (i < 0) return;
      const src = d.columns[i];
      const optMap = new Map<string, string>();
      const col: DBColumn = {
        ...src,
        id: newId(),
        name: `${src.name} copia`,
        options: src.options?.map((o) => {
          const nid = newId();
          optMap.set(o.id, nid);
          return { ...o, id: nid };
        }),
      };
      d.columns.splice(i + 1, 0, col);
      for (const r of d.rows) {
        const v = r.cells[colId];
        r.cells[col.id] = Array.isArray(v) ? v.map((x) => optMap.get(x) ?? x) : v;
      }
    }, `coldup:${colId}`);

  const updateSelectOption = (colId: string, optId: string, patch: Partial<Omit<SelectOption, 'id'>>) =>
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      const o = col?.options?.find((x) => x.id === optId);
      if (o) Object.assign(o, patch);
    }, `opt:${colId}:${optId}`);

  const removeSelectOption = (colId: string, optId: string) =>
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (!col) return;
      col.options = (col.options ?? []).filter((o) => o.id !== optId);
      for (const r of d.rows) {
        const v = r.cells[colId];
        if (Array.isArray(v)) {
          const next = v.filter((x) => x !== optId);
          r.cells[colId] = next.length ? next : null;
        } else if (v === optId) {
          r.cells[colId] = null;
        }
      }
    }, `optdel:${colId}:${optId}`);

  const addSelectOption = (colId: string, label: string) => {
    const id = newId();
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (!col) return;
      col.options = [...(col.options ?? []), { id, label: label.trim(), color: nextColor(col.options?.length ?? 0) }];
    }, `optadd:${colId}`);
    return id;
  };

  const setNumberFormat = (colId: string, format: NumberFormat) =>
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (col) col.numberFormat = format;
    }, `numfmt:${colId}:${format}`);

  const setRowCover = (rowId: string, cover: string | null) =>
    mutate((d) => {
      const row = d.rows.find((r) => r.id === rowId);
      if (!row) return;
      if (cover) row.cover = cover;
      else delete row.cover;
    }, `rowcover:${rowId}`);

  const COVER_LIMIT = 1_500_000;
  const applyCoverFile = (rowId: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > COVER_LIMIT) return;
    const reader = new FileReader();
    reader.onload = () => { setRowCover(rowId, String(reader.result)); setCoverRow(null); };
    reader.readAsDataURL(file);
  };

  const setNumberPrecision = (colId: string, precision: number | null) =>
    mutate((d) => {
      const col = d.columns.find((c) => c.id === colId);
      if (col) col.numberPrecision = precision;
    }, `numprec:${colId}:${precision}`);

  const groupCol = db.columns.find((c) => c.id === db.groupByColumnId && c.type === 'select')
    ?? db.columns.find((c) => c.type === 'select') ?? null;
  const dateCol = db.columns.find((c) => c.id === db.calendarColumnId && c.type === 'date')
    ?? db.columns.find((c) => c.type === 'date') ?? null;

  const firstColId = db.columns[0]?.id;
  const menuColumn = db.columns.find((c) => c.id === menuCol) ?? null;

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
            { v: 'gallery' as DBView, label: 'Galería', icon: 'image' as IconName },
            { v: 'list' as DBView, label: 'Lista', icon: 'numberedList' as IconName },
            { v: 'timeline' as DBView, label: 'Línea de tiempo', icon: 'clock' as IconName },
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
              onChange={(e) => mutate((d) => { d.filter = e.target.value; }, 'filter')}
              aria-label="Filtrar filas"
            />
          </div>
          {db.view === 'board' && db.columns.filter((c) => c.type === 'select').length > 0 && (
            <select
              className="dbselect"
              value={groupCol?.id ?? ''}
              onChange={(e) => mutate((d) => { d.groupByColumnId = e.target.value; }, `group:${e.target.value}`)}
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
                {TYPES.map(({ type, label, icon }) => (
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
                  <th key={col.id} style={{ position: 'relative' }}>
                    <button
                      className={`thname${db.sortColumnId === col.id ? ' is-sorted' : ''}`}
                      onClick={(e) => {
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenuPos({ x: r.left, y: r.bottom + 4 });
                        setMenuCol((v) => (v === col.id ? null : col.id));
                        setPaletteFor(null);
                      }}
                      title="Editar propiedad (nombre, tipo, formato, opciones)"
                      aria-haspopup="menu"
                      aria-expanded={menuCol === col.id}
                    >
                      <span className="thname__type" aria-hidden="true">
                        <Icon name={TYPES.find((t) => t.type === col.type)?.icon ?? 'text'} size={12} />
                      </span>
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
                    {menuCol === col.id && menuColumn && (
                      <ColumnMenu
                        db={db}
                        col={menuColumn}
                        menuRef={colMenuRef}
                        pos={menuPos}
                        paletteFor={paletteFor}
                        setPaletteFor={setPaletteFor}
                        onClose={() => { setMenuCol(null); setPaletteFor(null); }}
                        onRename={(name) => renameColumn(col.id, name)}
                        onChangeType={(t) => changeColumnType(col.id, t)}
                        onDelete={() => { deleteColumn(col.id); setMenuCol(null); }}
                        onDuplicate={() => { duplicateColumn(col.id); setMenuCol(null); }}
                        onSort={(dir) => mutate((d) => {
                          if (dir === null) { d.sortColumnId = null; return; }
                          if (d.sortColumnId === col.id && d.sortDir === dir) { d.sortColumnId = null; return; }
                          d.sortColumnId = col.id;
                          d.sortDir = dir;
                        }, `sort:${col.id}:${dir ?? 'off'}`)}
                        sortActive={db.sortColumnId === col.id ? db.sortDir : null}
                        onSetFormat={(f) => setNumberFormat(col.id, f)}
                        onSetPrecision={(p) => setNumberPrecision(col.id, p)}
                        onUpdateOption={(oid, patch) => updateSelectOption(col.id, oid, patch)}
                        onRemoveOption={(oid) => removeSelectOption(col.id, oid)}
                        onAddOption={(label) => addSelectOption(col.id, label)}
                      />
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
                          <button className="pill" data-color={opt?.color ?? 'default'} onClick={() => setOpenCell(openCell === cellKey ? null : cellKey)}>
                            <i />{opt?.label ?? 'Elegir…'}
                          </button>
                          {openCell === cellKey && (
                            <SelectCellPopover
                              popRef={cellPopRef}
                              col={col}
                              selected={row.cells[col.id] == null ? [] : [String(row.cells[col.id])]}
                              onToggle={(oid) => { setCell(row.id, col.id, oid); setOpenCell(null); }}
                              onClear={() => { setCell(row.id, col.id, null); setOpenCell(null); }}
                              newOption={newOption}
                              setNewOption={setNewOption}
                              onCreate={(label) => {
                                const id = addSelectOption(col.id, label);
                                setCell(row.id, col.id, id);
                                setNewOption('');
                                setOpenCell(null);
                              }}
                            />
                          )}
                        </td>
                      );
                    }
                    if (col.type === 'multi_select') {
                      const ids = Array.isArray(row.cells[col.id]) ? (row.cells[col.id] as string[]) : [];
                      const selected = col.options?.filter((o) => ids.includes(o.id)) ?? [];
                      return (
                        <td key={col.id} style={{ position: 'relative' }}>
                          <button
                            className="pillstack"
                            data-empty={selected.length === 0 ? 'true' : undefined}
                            onClick={() => setOpenCell(openCell === cellKey ? null : cellKey)}
                          >
                            {selected.length === 0
                              ? <>Elegir…</>
                              : selected.map((o) => <span key={o.id} className="pill" data-color={o.color}><i />{o.label}</span>)}
                          </button>
                          {openCell === cellKey && (
                            <SelectCellPopover
                              popRef={cellPopRef}
                              col={col}
                              selected={ids}
                              multi
                              onToggle={(oid) => {
                                const next = ids.includes(oid) ? ids.filter((x) => x !== oid) : [...ids, oid];
                                setCell(row.id, col.id, next.length ? next : null);
                              }}
                              onClear={() => { setCell(row.id, col.id, null); setOpenCell(null); }}
                              newOption={newOption}
                              setNewOption={setNewOption}
                              onCreate={(label) => {
                                const id = addSelectOption(col.id, label);
                                const next = [...ids, id];
                                setCell(row.id, col.id, next);
                                setNewOption('');
                              }}
                            />
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
                    if (col.type === 'number') {
                      const raw = row.cells[col.id];
                      return (
                        <td key={col.id}>
                          <NumberCell
                            value={typeof raw === 'number' && Number.isFinite(raw) ? raw : null}
                            col={col}
                            onCommit={(n) => setCell(row.id, col.id, n)}
                            ariaLabel={col.name}
                          />
                        </td>
                      );
                    }
                    if (col.type === 'url' || col.type === 'email' || col.type === 'phone') {
                      const raw = row.cells[col.id];
                      const text = raw == null || Array.isArray(raw) ? '' : String(raw);
                      return (
                        <td key={col.id}>
                          <LinkCell
                            kind={col.type}
                            text={text}
                            onCommit={(s) => setCell(row.id, col.id, s === '' ? null : s)}
                            ariaLabel={col.name}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={col.id}>
                        <input
                          className="cellinput"
                          type="text"
                          value={String(row.cells[col.id] ?? '')}
                          onChange={(e) => setCell(row.id, col.id, e.target.value)}
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
          {[...(groupCol.options ?? []), { id: '__none__', label: 'Sin estado', color: 'default' as TagColor }].map((opt) => {
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
                  <span className="pill" data-color={opt.color}><i />{opt.label}</span>
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
                        return o ? <span key={c.id} className="pill" data-color={o.color}><i />{o.label}</span> : null;
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

      {/* VISTA GALERÍA */}
      {db.view === 'gallery' && (
        <div className="gallery" role="list" aria-label="Galería de la base de datos">
          {filteredRows.map((row) => {
            const titleCol = db.columns[0];
            const selectCol = db.columns.find((c) => c.type === 'select' || c.type === 'multi_select');
            const coverOpt = selectCol?.options?.find((o) => o.id === row.cells[selectCol.id]);
            const props = db.columns.slice(1, 4);
            return (
              <article key={row.id} className="gcard" role="listitem">
                {row.cover ? (
                  <img className="gcard__cover-img" src={row.cover} alt="" loading="lazy" />
                ) : (
                  <div className="gcard__cover" data-color={coverOpt?.color ?? 'default'} />
                )}
                <button
                  className="gcard__coverbtn"
                  title={row.cover ? 'Cambiar portada' : 'Añadir portada'}
                  aria-label={row.cover ? 'Cambiar portada' : 'Añadir portada'}
                  aria-expanded={coverRow === row.id}
                  onClick={() => { setCoverRow((v) => (v === row.id ? null : row.id)); setCoverUrl(row.cover ?? ''); }}
                >
                  <Icon name="image" size={12} />
                </button>
                {coverRow === row.id && (
                  <div className="coverpop" ref={coverPopRef} role="menu" aria-label="Editar portada">
                    <input
                      className="coverpop__input"
                      autoFocus
                      value={coverUrl}
                      placeholder="Pega una URL de imagen…"
                      onChange={(e) => setCoverUrl(e.target.value)}
                      aria-label="URL de la portada"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && coverUrl.trim()) { setRowCover(row.id, coverUrl.trim()); setCoverRow(null); }
                        if (e.key === 'Escape') setCoverRow(null);
                      }}
                    />
                    <div className="coverpop__row">
                      <button className="filebtn" onClick={() => { if (coverUrl.trim()) { setRowCover(row.id, coverUrl.trim()); setCoverRow(null); } }}>Aplicar</button>
                      <label className="filebtn">
                        Subir
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => applyCoverFile(row.id, e.target.files?.[0])} />
                      </label>
                      {row.cover && (
                        <button className="filebtn filebtn--danger" onClick={() => { setRowCover(row.id, null); setCoverRow(null); }}>Quitar</button>
                      )}
                    </div>
                  </div>
                )}
                <div className="gcard__body">
                  <span className="gcard__title">{titleCol ? cellText(row, titleCol) || 'Sin título' : 'Sin título'}</span>
                  <div className="gcard__props">
                    {props.map((c) => {
                      const v = row.cells[c.id];
                      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return null;
                      if (c.type === 'select' || c.type === 'multi_select') {
                        const ids = Array.isArray(v) ? v : [String(v)];
                        const opts = (c.options ?? []).filter((o) => ids.includes(o.id));
                        return opts.map((o) => <span key={c.id + o.id} className="pill" data-color={o.color}><i />{o.label}</span>);
                      }
                      if (c.type === 'checkbox') return v ? <span key={c.id} className="gcard__prop"><Icon name="check" size={11} /> {c.name}</span> : null;
                      return <span key={c.id} className="gcard__prop">{cellText(row, c)}</span>;
                    })}
                  </div>
                </div>
                <button className="rowdel gcard__del" title="Eliminar fila" aria-label="Eliminar fila" onClick={() => deleteRow(row.id)}>
                  <Icon name="x" size={12} />
                </button>
              </article>
            );
          })}
          <button className="gcard gcard--new" onClick={() => addRow()}>
            <Icon name="plus" size={14} /> Nueva fila
          </button>
        </div>
      )}

      {/* VISTA LISTA */}
      {db.view === 'list' && (
        <div className="dblist">
          {(() => {
            const group = db.columns.find((c) => c.id === db.groupByColumnId && c.type === 'select')
              ?? db.columns.find((c) => c.type === 'select');
            const titleCol = db.columns[0];
            const buckets: { key: string; label: string; color?: TagColor; rows: typeof filteredRows }[] = [];
            if (group) {
              for (const o of group.options ?? []) {
                buckets.push({ key: o.id, label: o.label, color: o.color, rows: filteredRows.filter((r) => r.cells[group.id] === o.id) });
              }
              const none = filteredRows.filter((r) => !r.cells[group.id]);
              if (none.length) buckets.push({ key: '__none__', label: 'Sin estado', color: 'default', rows: none });
            } else {
              buckets.push({ key: '__all__', label: '', rows: filteredRows });
            }
            return buckets.map((b) => (
              <section key={b.key} className="dbgroup">
                {b.label && (
                  <h4 className="dbgroup__head">
                    <span className="pill" data-color={b.color ?? 'default'}><i />{b.label}</span>
                    <span className="dbgroup__count">{b.rows.length}</span>
                  </h4>
                )}
                {b.rows.map((row) => (
                  <div key={row.id} className="lrow">
                    <span className="lrow__icon"><Icon name="doc" size={14} /></span>
                    <span className="lrow__title">{titleCol ? cellText(row, titleCol) || 'Sin título' : 'Sin título'}</span>
                    <span className="lrow__props">
                      {db.columns.slice(1, 4).map((c) => {
                        const v = row.cells[c.id];
                        if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return null;
                        if (c.type === 'select' || c.type === 'multi_select') {
                          const ids = Array.isArray(v) ? v : [String(v)];
                          const opts = (c.options ?? []).filter((o) => ids.includes(o.id));
                          return opts.map((o) => <span key={c.id + o.id} className="pill" data-color={o.color}><i />{o.label}</span>);
                        }
                        if (c.type === 'checkbox') return v ? <span key={c.id} className="lrow__prop"><Icon name="check" size={11} />{c.name}</span> : null;
                        return <span key={c.id} className="lrow__prop">{cellText(row, c)}</span>;
                      })}
                    </span>
                    <button className="rowdel" title="Eliminar fila" aria-label="Eliminar fila" onClick={() => deleteRow(row.id)}>
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                ))}
                <button className="addrow" onClick={() => addRow(group && b.key !== '__none__' && b.key !== '__all__' ? { [group.id]: b.key } : {})}>
                  <Icon name="plus" size={12} /> Nueva fila
                </button>
              </section>
            ));
          })()}
        </div>
      )}

      {/* VISTA LÍNEA DE TIEMPO */}
      {db.view === 'timeline' && (
        dateCol ? (
          <TimelineView db={db} dateCol={dateCol} rows={filteredRows} onDelete={deleteRow} onAdd={() => addRow()} />
        ) : (
          <p style={{ color: 'var(--ink-55)', padding: '30px 8px' }}>Añade una propiedad de Fecha para colocar las filas en la línea de tiempo.</p>
        )
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

      {(() => {
        const children = [...byId.values()].filter((p) => p.parentId === page.id && !p.trashed);
        return (
          <div className="subpages" aria-label="Subpáginas">
            <div className="subpages__head">
              <span className="subpages__label">Subpáginas</span>
              <button className="subpages__add" onClick={() => createPage(page.id, 'page')} title="Crear una subpágina aquí">
                <Icon name="plus" size={12} /> Nueva subpágina
              </button>
            </div>
            {children.length > 0 ? (
              <div className="subpages__grid">
                {children.map((p) => (
                  <button key={p.id} className="subpage" onClick={() => setActivePageId(p.id)} title={`Abrir ${p.title || 'Sin título'}`}>
                    <span className="subpage__icon"><Icon name={(p.icon || 'doc') as IconName} size={15} /></span>
                    <span className="subpage__title">{p.title || 'Sin título'}</span>
                    <span className="subpage__kind">{p.kind === 'database' ? 'Base de datos' : 'Página'}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="subpages__empty">Aún no hay subpáginas — crea una y aparecerá aquí y en el árbol.</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/* ── celda de número con formato (display) + edición ─────────────────────── */

function NumberCell({ value, col, onCommit, ariaLabel }: {
  value: number | null;
  col: DBColumn;
  onCommit: (n: number | null) => void;
  ariaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const s = draft.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const n = s === '' ? null : Number(s);
    setEditing(false);
    onCommit(n != null && Number.isFinite(n) ? n : null);
  };
  if (editing) {
    return (
      <input
        className="cellinput"
        type="text"
        inputMode="decimal"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false); }
        }}
        aria-label={ariaLabel}
      />
    );
  }
  return (
    <button
      className="numcell"
      onClick={() => { setDraft(value == null ? '' : String(value).replace('.', ',')); setEditing(true); }}
      title="Editar número"
      aria-label={ariaLabel}
    >
      {value == null ? '' : formatNumberCell(value, col)}
    </button>
  );
}

/* ── celda de enlace (url / email / teléfono) ────────────────────────────── */

function LinkCell({ kind, text, onCommit, ariaLabel }: {
  kind: 'url' | 'email' | 'phone';
  text: string;
  onCommit: (s: string) => void;
  ariaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const href =
    kind === 'url' ? (/^https?:\/\//i.test(text) ? text : `https://${text}`)
    : kind === 'email' ? `mailto:${text}`
    : `tel:${text.replace(/[^+\d]/g, '')}`;

  if (editing) {
    return (
      <input
        className="cellinput"
        type="text"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onCommit(draft.trim()); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setDraft(text); setEditing(false); }
        }}
        aria-label={ariaLabel}
      />
    );
  }
  if (!text) {
    return (
      <button className="cellghost" onClick={() => { setDraft(''); setEditing(true); }} aria-label={ariaLabel}>
        <Icon name={kind === 'url' ? 'link' : kind === 'email' ? 'mail' : 'phone'} size={12} /> Vacío
      </button>
    );
  }
  return (
    <span className="celllink">
      <a href={href} target="_blank" rel="noreferrer noopener" title="Abrir enlace">
        <Icon name={kind === 'url' ? 'link' : kind === 'email' ? 'mail' : 'phone'} size={12} />
        {text}
      </a>
      <button className="celledit" title="Editar" aria-label={`Editar ${ariaLabel}`} onClick={() => { setDraft(text); setEditing(true); }}>
        <Icon name="pen" size={11} />
      </button>
    </span>
  );
}

/* ── popover de opciones de selección / multi-selección ──────────────────── */

function SelectCellPopover({
  popRef, col, selected, multi = false, onToggle, onClear, newOption, setNewOption, onCreate,
}: {
  popRef: React.RefObject<HTMLDivElement | null>;
  col: DBColumn;
  selected: string[];
  multi?: boolean;
  onToggle: (optionId: string) => void;
  onClear: () => void;
  newOption: string;
  setNewOption: (v: string) => void;
  onCreate: (label: string) => void;
}) {
  return (
    <div className="cellopts" ref={popRef} role="listbox" aria-label={`Elegir ${col.name}`} data-multi={multi || undefined}>
      {(col.options ?? []).map((o) => (
        <button
          key={o.id}
          role="option"
          aria-selected={selected.includes(o.id)}
          onClick={() => onToggle(o.id)}
        >
          <span className="pill" data-color={o.color} style={{ pointerEvents: 'none' }}><i />{o.label}</span>
          {multi && <span className="cellopts__mark">{selected.includes(o.id) ? <Icon name="check" size={11} /> : ''}</span>}
        </button>
      ))}
      <div className="newopt">
        <input
          value={newOption}
          placeholder="Nueva opción…"
          onChange={(e) => setNewOption(e.target.value)}
          aria-label="Nueva opción de selección"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newOption.trim()) onCreate(newOption.trim());
          }}
        />
      </div>
      {selected.length > 0 && (
        <button className="cellopts__clear" onClick={onClear}>
          <Icon name="x" size={11} /> Quitar selección
        </button>
      )}
    </div>
  );
}

/* ── menú de columna (estilo Notion) ─────────────────────────────────────── */

function ColumnMenu({
  db, col, menuRef, pos, paletteFor, setPaletteFor, onClose,
  onRename, onChangeType, onDelete, onDuplicate, onSort, sortActive,
  onSetFormat, onSetPrecision, onUpdateOption, onRemoveOption, onAddOption,
}: {
  db: DBState;
  col: DBColumn;
  menuRef: React.RefObject<HTMLDivElement | null>;
  pos: { x: number; y: number };
  paletteFor: string | null;
  setPaletteFor: (v: string | null) => void;
  onClose: () => void;
  onRename: (name: string) => void;
  onChangeType: (t: PropertyType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSort: (dir: 'asc' | 'desc' | null) => void;
  sortActive: 'asc' | 'desc' | null;
  onSetFormat: (f: NumberFormat) => void;
  onSetPrecision: (p: number | null) => void;
  onUpdateOption: (optionId: string, patch: Partial<Omit<SelectOption, 'id'>>) => void;
  onRemoveOption: (optionId: string) => void;
  onAddOption: (label: string) => void;
}) {
  const [draftName, setDraftName] = useState(col.name);
  const [newOpt, setNewOpt] = useState('');
  const commitName = () => onRename(draftName);

  const rowValues = db.rows.map((r) => r.cells[col.id]);
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(pos.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 312),
    top: Math.min(pos.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 380),
  };

  return (
    <div className="colmenu" ref={menuRef} style={style} role="menu" aria-label={`Editar propiedad ${col.name}`}>
      <input
        className="colmenu__name"
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setDraftName(col.name); onClose(); }
        }}
        placeholder="Nombre de la propiedad"
        aria-label="Nombre de la propiedad"
      />

      <div className="colmenu__section">
        <p className="colmenu__label">Tipo</p>
        <div className="colmenu__types">
          {TYPES.map(({ type, label, icon }) => (
            <button key={type} role="menuitem" className={`coltype${col.type === type ? ' is-active' : ''}`} onClick={() => onChangeType(type)}>
              <Icon name={icon} size={14} /> {label}
              {col.type === type && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
      </div>

      {col.type === 'number' && (
        <div className="colmenu__section">
          <p className="colmenu__label">Formato de número</p>
          <div className="numgrid">
            {NUMBER_FORMATS.map((f) => (
              <button key={f.id} role="menuitem" className={`numfmt${(col.numberFormat ?? 'plain') === f.id ? ' is-active' : ''}`} onClick={() => onSetFormat(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <p className="colmenu__label" style={{ marginTop: 8 }}>Decimales</p>
          <div className="precgrid">
            {NUMBER_PRECISIONS.map((p) => (
              <button key={p.label} role="menuitem" className={`prec${(col.numberPrecision ?? null) === p.value ? ' is-active' : ''}`} onClick={() => onSetPrecision(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
          {rowValues.some((v) => typeof v === 'number' && Number.isFinite(v)) && (
            <p className="colmenu__hint">
              Ej.: {formatNumberCell(rowValues.find((v) => typeof v === 'number') as number, col)}
            </p>
          )}
        </div>
      )}

      {(col.type === 'select' || col.type === 'multi_select') && (
        <div className="colmenu__section">
          <p className="colmenu__label">Opciones</p>
          <div className="colmenu__opts">
            {(col.options ?? []).map((o) => (
              <div key={o.id} className="optrow" style={{ position: 'relative' }}>
                <button
                  className="optswatch"
                  data-color={o.color}
                  title="Cambiar color"
                  aria-label={`Color de ${o.label}`}
                  onClick={() => setPaletteFor(paletteFor === o.id ? null : o.id)}
                />
                <input
                  className="optrow__label"
                  defaultValue={o.label}
                  onBlur={(e) => { if (e.target.value.trim() && e.target.value !== o.label) onUpdateOption(o.id, { label: e.target.value.trim() }); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  aria-label={`Etiqueta de ${o.label}`}
                />
                <button className="optrow__del" title="Eliminar opción" aria-label={`Eliminar opción ${o.label}`} onClick={() => onRemoveOption(o.id)}>
                  <Icon name="x" size={11} />
                </button>
                {paletteFor === o.id && (
                  <div className="palette" role="menu" aria-label="Elegir color">
                    {ALL_TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        role="menuitem"
                        className={`pal__swatch${o.color === c ? ' is-active' : ''}`}
                        data-color={c}
                        title={c}
                        aria-label={`Color ${c}`}
                        onClick={() => { onUpdateOption(o.id, { color: c }); setPaletteFor(null); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="newopt">
            <input
              value={newOpt}
              placeholder="Añadir opción…"
              onChange={(e) => setNewOpt(e.target.value)}
              aria-label="Añadir opción"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newOpt.trim()) { onAddOption(newOpt.trim()); setNewOpt(''); }
              }}
            />
          </div>
        </div>
      )}

      <div className="colmenu__footer">
        <button role="menuitem" className={sortActive === 'asc' ? 'is-active' : ''} onClick={() => onSort('asc')}>
          <Icon name="chevronUp" size={12} /> Ordenar ascendente
        </button>
        <button role="menuitem" className={sortActive === 'desc' ? 'is-active' : ''} onClick={() => onSort('desc')}>
          <Icon name="chevronDown" size={12} /> Ordenar descendente
        </button>
        {sortActive && (
          <button role="menuitem" onClick={() => onSort(null)}>
            <Icon name="x" size={12} /> Quitar orden
          </button>
        )}
        <button role="menuitem" onClick={onDuplicate}><Icon name="duplicate" size={12} /> Duplicar propiedad</button>
        <button role="menuitem" className="is-danger" onClick={onDelete}><Icon name="trash" size={12} /> Eliminar propiedad</button>
      </div>
    </div>
  );
}

/* ── línea de tiempo (vista tipo Notion) ─────────────────────────────────── */

function TimelineView({
  db, dateCol, rows, onDelete, onAdd,
}: {
  db: DBState;
  dateCol: DBColumn;
  rows: DBRow[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const { windowStart, ticks, span } = useMemo(() => {
    const times = rows
      .map((r) => Date.parse(String(r.cells[dateCol.id] ?? '')))
      .filter((n) => Number.isFinite(n));
    const min = times.length ? Math.min(...times) : Date.now();
    const start = new Date(min);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 4);
    const t: { label: string; pct: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      t.push({ label: d.toLocaleString('es', { month: 'short', year: '2-digit' }), pct: ((d.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100 });
    }
    return { windowStart: start.getTime(), ticks: t, span: end.getTime() - start.getTime() };
  }, [rows, dateCol.id]);

  const selectCol = db.columns.find((c) => c.type === 'select' || c.type === 'multi_select');
  const titleCol = db.columns[0];

  const placed = rows
    .map((row) => {
      const ts = Date.parse(String(row.cells[dateCol.id] ?? ''));
      const pct = Number.isFinite(ts) ? Math.min(99.2, Math.max(0.8, ((ts - windowStart) / span) * 100)) : null;
      const opt = selectCol?.options?.find((o) => o.id === row.cells[selectCol.id]);
      return { row, ts, pct, opt };
    })
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  return (
    <div className="timeline" role="list" aria-label="Línea de tiempo">
      <div className="timeline__head">
        <span className="timeline__corner">Fecha · {dateCol.name}</span>
        <div className="timeline__axis">
          {ticks.map((t) => (
            <span key={t.label} className="timeline__tick" style={{ left: `${t.pct}%` }}>{t.label}</span>
          ))}
        </div>
      </div>
      {placed.map(({ row, pct, opt }) => (
        <div key={row.id} className="tlrow" role="listitem">
          <span className="tlrow__title">{titleCol ? cellText(row, titleCol) || 'Sin título' : 'Sin título'}</span>
          <div className="tlrow__track">
            {pct == null ? (
              <span className="tlrow__nodate">sin fecha</span>
            ) : (
              <span className="tlchip" data-color={opt?.color ?? 'default'} style={{ left: `${pct}%` }}>
                {String(row.cells[dateCol.id])}
              </span>
            )}
          </div>
          <button className="rowdel" title="Eliminar fila" aria-label="Eliminar fila" onClick={() => onDelete(row.id)}>
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}
      <button className="addrow" onClick={onAdd}><Icon name="plus" size={12} /> Nueva fila</button>
    </div>
  );
}

/* ── gráfico ─────────────────────────────────────────────────────────────── */

function ChartView({ db }: { db: NonNullable<Page['db']> }) {
  const candidates = db.columns;
  const [axisId, setAxisId] = useState<string>(() => candidates[0]?.id ?? '');
  const axis = candidates.find((c) => c.id === axisId) ?? candidates[0];

  const data = useMemo((): { label: string; value: number; color?: TagColor }[] => {
    if (!axis) return [];
    if (axis.type === 'select' || axis.type === 'multi_select') {
      const counts = new Map<string, number>();
      for (const r of db.rows) {
        const v = r.cells[axis.id];
        const ids = Array.isArray(v) ? v : v ? [String(v)] : [];
        if (ids.length === 0) counts.set('__none__', (counts.get('__none__') ?? 0) + 1);
        for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      const arr = (axis.options ?? []).map((o) => ({ label: o.label, value: counts.get(o.id) ?? 0, color: o.color }));
      const none = counts.get('__none__') ?? 0;
      if (none > 0) arr.push({ label: 'Sin valor', value: none, color: 'default' });
      return arr;
    }
    if (axis.type === 'checkbox') {
      let yes = 0;
      for (const r of db.rows) if (r.cells[axis.id]) yes += 1;
      return [
        { label: 'Sí', value: yes, color: 'green' },
        { label: 'No', value: db.rows.length - yes, color: 'gray' },
      ];
    }
    if (axis.type === 'date') {
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
    }
    // texto, número, URL, correo, teléfono: conteo por valor (8 más frecuentes)
    const counts = new Map<string, number>();
    for (const r of db.rows) {
      const label = cellText(r, axis).trim() || 'Sin valor';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
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

  const barFill = (color?: TagColor) =>
    color && color !== 'default' ? `var(--tagc-${color})` : 'var(--ink-70, var(--ink))';

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
          const fill = barFill(d.color);
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

/* ── calendario ──────────────────────────────────────────────────────────── */

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
                <span key={r.id} className="cal__chip" title={db.columns.length ? cellText(r, db.columns[0]) : 'Sin título'}>
                  {db.columns.length ? cellText(r, db.columns[0]) : 'Sin título'}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

