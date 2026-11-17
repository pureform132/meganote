import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';
import { getPageDrag, hasPageDrag, setPageDrag } from '../lib/pageDrag';
import { parseNotionExport } from '../lib/notionImport';
import { currentTheme, toggleTheme, type Theme } from '../lib/theme';
import type { Page } from '../lib/types';

const EXPANDED_KEY = 'takenotes.expanded';

function loadExpanded(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    pages, byId, activePageId, setActivePageId, createPage, movePage, toggleFavorite, trashPage,
    setSearchOpen, setShowTrash, showTrash, trashCount,
    notebooks, currentNotebookId, currentNotebookName, setCurrentNotebook, createNotebook, renameNotebook,
    exportBackup, importBackup, importPages, saveState, savedAt,
  } = useWorkspace();
  const [expanded, setExpanded] = useState<Set<string>>(loadExpanded);
  const [dropId, setDropId] = useState<string | null>(null);

  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [creatingWs, setCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [renamingWsId, setRenamingWsId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const wsRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<Theme>(() => currentTheme());
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [notionHelp, setNotionHelp] = useState(false);
  const [notionBusy, setNotionBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const notionFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
  }, [expanded]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (wsMenuOpen && !wsRef.current?.contains(t)) setWsMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [wsMenuOpen]);

  const currentNotebookIcon = (notebooks.find((n) => n.id === currentNotebookId)?.icon ?? 'folder') as IconName;

  const toggleOpen = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Page[]>();
    for (const p of pages) {
      const key = p.parentId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [pages]);

  const favorites = pages.filter((p) => p.favorite);

  const confirmImport = async () => {
    if (!pendingImport) return;
    const res = await importBackup(pendingImport);
    if (res.ok) setNotice({ kind: 'ok', text: `Restauradas ${res.count} páginas desde el backup.` });
    else setNotice({ kind: 'err', text: res.error ?? 'No se pudo restaurar.' });
    setPendingImport(null);
  };

  const confirmNotionImport = async (file: File) => {
    setNotionBusy(true);
    try {
      const res = await parseNotionExport(file);
      const n = importPages(res.pages);
      setNotice({
        kind: 'ok',
        text: `Importación completa: ${n} páginas, ${res.databases} bases de datos${res.imagesEmbedded ? `, ${res.imagesEmbedded} imágenes` : ''}${res.skipped ? ` (${res.skipped} omitidas)` : ''}.`,
      });
      setNotionHelp(false);
    } catch (e) {
      setNotice({ kind: 'err', text: 'No se pudo importar: ' + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setNotionBusy(false);
    }
  };

  const createWs = () => {
    const name = newWsName.trim();
    if (!name) return;
    createNotebook(name);
    setNewWsName('');
    setCreatingWs(false);
    setWsMenuOpen(false);
  };

  const moveInto = (targetId: string, e: DragEvent) => {
    const draggedId = getPageDrag(e);
    if (!draggedId) return;
    e.preventDefault();
    e.stopPropagation();
    setDropId(null);
    if (draggedId === targetId) return;
    const dragged = byId.get(draggedId);
    const target = byId.get(targetId);
    if (!dragged || !target) return;
    if (dragged.parentId === targetId) {
      setExpanded((prev) => new Set(prev).add(targetId));
      setNotice({ kind: 'ok', text: `«${dragged.title || 'Sin título'}» ya está dentro de «${target.title || 'Sin título'}».` });
      return;
    }
    if (!movePage(draggedId, targetId)) {
      setNotice({ kind: 'err', text: 'No puedes mover una página dentro de sí misma ni de una de sus subpáginas.' });
      return;
    }
    setExpanded((prev) => new Set(prev).add(targetId));
    setNotice({ kind: 'ok', text: `«${dragged.title || 'Sin título'}» ahora es una subpágina de «${target.title || 'Sin título'}».` });
  };

  const dropProps = (targetId: string) => ({
    onDragOver: (e: DragEvent) => {
      if (!hasPageDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDropId(targetId);
    },
    onDragLeave: (e: DragEvent) => {
      const next = e.relatedTarget as Node | null;
      if (!next || !e.currentTarget.contains(next)) setDropId((current) => (current === targetId ? null : current));
    },
    onDrop: (e: DragEvent) => moveInto(targetId, e),
  });

  const renderTree = (parentId: string | null, depth: number) => {
    const kids = childrenOf.get(parentId) ?? [];
    return kids.map((p) => {
      const kids2 = childrenOf.get(p.id) ?? [];
      const hasKids = kids2.length > 0;
      const isOpen = expanded.has(p.id);
      return (
        <div key={p.id} role="treeitem" aria-expanded={hasKids ? isOpen : undefined}>
          <button
            className={`treerow${activePageId === p.id && !showTrash ? ' is-active' : ''}${dropId === p.id ? ' is-drop' : ''}`}
            style={{ paddingLeft: `${2 + depth * 14}px` }}
            data-page-id={p.id}
            draggable
            onDragStart={(e) => setPageDrag(e, p.id)}
            {...dropProps(p.id)}
            onClick={() => {
              setActivePageId(p.id);
              setShowTrash(false);
              onClose();
              if (hasKids && !isOpen) toggleOpen(p.id);
            }}
          >
            {activePageId === p.id && !showTrash && (
              <svg className="treerow__tab" viewBox="0 0 7 17" width="7" height="17" aria-hidden="true">
                <path d="M5.6 0.9 C4.4 5.2 4.4 11.6 5.6 16.1 L2.5 15.3 C1.4 10.6 1.4 6.3 2.5 1.7 Z" fill="currentColor" />
              </svg>
            )}
            <span
              className={`treerow__twisty${isOpen ? ' is-open' : ''}${hasKids ? '' : ' is-leaf'}`}
              role="button"
              aria-label={isOpen ? 'Contraer' : 'Expandir'}
              tabIndex={hasKids ? 0 : -1}
              onClick={(e) => {
                if (!hasKids) return;
                e.stopPropagation();
                toggleOpen(p.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleOpen(p.id);
                }
              }}
            >
              <Icon name="chevronRight" size={13} />
            </span>
            <span className="treerow__icon">
              <Icon name={(p.icon || 'doc') as IconName} size={15} />
            </span>
            <span className="treerow__title">{p.title || 'Sin título'}</span>
            <span className="treerow__actions">
              <button
                className={`rowaction${p.favorite ? ' is-fav' : ''}`}
                title={p.favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                aria-label={p.favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(p.id);
                }}
              >
                <Icon name="star" size={13} filled={p.favorite} />
              </button>
              <button
                className="rowaction"
                title="Mover a la papelera"
                aria-label="Mover página a la papelera"
                onClick={(e) => {
                  e.stopPropagation();
                  trashPage(p.id);
                }}
              >
                <Icon name="trash" size={13} />
              </button>
            </span>
          </button>
          {hasKids && isOpen && <div role="group">{renderTree(p.id, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Barra lateral del cuaderno">
        <div className="sidebar__brand">
          <Icon name="logo" size={26} strokeWidth={1.7} className="sidebar__logo" />
          <div>
            <h1 className="sidebar__wordmark">Takenotes</h1>
            <p className="sidebar__tagline">LOCAL · TUYO · PARA SIEMPRE</p>
          </div>
        </div>

        {/* Selector de workspaces */}
        <div className="wsswitch" ref={wsRef}>
          <button
            className="wsswitch__btn"
            onClick={() => setWsMenuOpen((v) => !v)}
            aria-expanded={wsMenuOpen}
            aria-haspopup="menu"
            title="Cambiar de workspace"
          >
            <Icon name={currentNotebookIcon} size={15} />
            <span className="wsswitch__name">{currentNotebookName}</span>
            <Icon name={wsMenuOpen ? 'chevronUp' : 'chevronDown'} size={13} />
          </button>
          {wsMenuOpen && (
            <div className="wsswitch__menu" role="menu" aria-label="Workspaces">
              {notebooks.map((nb) => (
                <div key={nb.id} className="wsswitch__row">
                  {renamingWsId === nb.id ? (
                    <input
                      className="wsswitch__rename"
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      aria-label="Renombrar workspace"
                      onBlur={() => {
                        renameNotebook(nb.id, renameVal);
                        setRenamingWsId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setRenamingWsId(null);
                      }}
                    />
                  ) : (
                    <>
                      <button
                        role="menuitem"
                        aria-current={nb.id === currentNotebookId ? 'true' : undefined}
                        className={`wsswitch__item${nb.id === currentNotebookId ? ' is-current' : ''}`}
                        onClick={() => {
                          setCurrentNotebook(nb.id);
                          setWsMenuOpen(false);
                        }}
                      >
                        <Icon name={(nb.icon || 'folder') as IconName} size={14} />
                        <span className="wsswitch__itemname">{nb.name}</span>
                        {nb.id === currentNotebookId && <Icon name="check" size={12} />}
                      </button>
                      <button
                        className="wsswitch__renamebtn"
                        title="Renombrar workspace"
                        aria-label={`Renombrar ${nb.name}`}
                        onClick={() => {
                          setRenamingWsId(nb.id);
                          setRenameVal(nb.name);
                        }}
                      >
                        <Icon name="pen" size={11} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              <div className="wsswitch__footer">
                {creatingWs ? (
                  <form
                    className="wsswitch__newform"
                    onSubmit={(e) => {
                      e.preventDefault();
                      createWs();
                    }}
                  >
                    <input
                      autoFocus
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="Nombre del workspace…"
                      aria-label="Nombre del nuevo workspace"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setCreatingWs(false);
                      }}
                    />
                    <button type="submit" className="wsswitch__renamebtn" aria-label="Crear workspace">
                      <Icon name="check" size={13} />
                    </button>
                  </form>
                ) : (
                  <button className="wsswitch__new" onClick={() => setCreatingWs(true)}>
                    <Icon name="plus" size={13} /> Nuevo workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="sidebar__search" onClick={() => setSearchOpen(true)} aria-label="Abrir búsqueda (Ctrl K)">
          <Icon name="search" size={14} />
          <span>Buscar o saltar a…</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="sidebar__newrow">
          <button className="btn btn--primary" onClick={() => createPage(null, 'page')}>
            <Icon name="plus" size={14} strokeWidth={2} /> Nueva página
          </button>
          <button className="iconbtn" title="Nueva base de datos" aria-label="Nueva base de datos" onClick={() => createPage(null, 'database')}>
            <Icon name="table" size={16} />
          </button>
        </div>

        <div className="sidebar__scroll">
          {favorites.length > 0 && (
            <div className="sidegroup">
              <p className="sidegroup__label">Favoritos</p>
              <div role="tree" aria-label="Páginas favoritas">
                {favorites.map((p) => (
                  <button
                    key={p.id}
                    className={`treerow${activePageId === p.id && !showTrash ? ' is-active' : ''}${dropId === p.id ? ' is-drop' : ''}`}
                    style={{ paddingLeft: '4px' }}
                    data-page-id={p.id}
                    draggable
                    onDragStart={(e) => setPageDrag(e, p.id)}
                    {...dropProps(p.id)}
                    onClick={() => {
                      setActivePageId(p.id);
                      setShowTrash(false);
                      onClose();
                    }}
                  >
                    {activePageId === p.id && !showTrash && (
                      <svg className="treerow__tab" viewBox="0 0 7 17" width="7" height="17" aria-hidden="true">
                        <path d="M5.6 0.9 C4.4 5.2 4.4 11.6 5.6 16.1 L2.5 15.3 C1.4 10.6 1.4 6.3 2.5 1.7 Z" fill="currentColor" />
                      </svg>
                    )}
                    <span className="treerow__icon"><Icon name={(p.icon || 'doc') as IconName} size={15} /></span>
                    <span className="treerow__title">{p.title || 'Sin título'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sidegroup">
            <p className="sidegroup__label">
              {favorites.length > 0 ? 'Todas las páginas' : 'Páginas'}
              <button
                className="rowaction"
                title="Nueva página"
                aria-label="Nueva página"
                onClick={() => createPage(null, 'page')}
              >
                <Icon name="plus" size={13} />
              </button>
            </p>
            <div role="tree" aria-label="Árbol de páginas">
              {renderTree(null, 0)}
            </div>
          </div>
        </div>

        {/* Copia de seguridad + restaurar + importar de Notion */}
        <div className="sidebar__data" aria-label="Copia de seguridad y restauración">
          <button className="iconbtn" title="Descargar copia de seguridad (JSON)" aria-label="Descargar copia de seguridad" onClick={exportBackup}>
            <Icon name="export" size={15} />
          </button>
          <button className="iconbtn" title="Restaurar copia de seguridad (JSON)" aria-label="Restaurar copia de seguridad" onClick={() => fileRef.current?.click()}>
            <Icon name="restore" size={15} />
          </button>
          <button
            className="iconbtn"
            title="Importar exportación de Notion"
            aria-label="Importar exportación de Notion"
            aria-expanded={notionHelp}
            onClick={() => setNotionHelp((v) => !v)}
          >
            <Icon name="import" size={15} />
          </button>
          <span className="savestatus" role="status" aria-live="polite">
            <Icon name={saveState === 'saved' ? 'check' : 'clock'} size={10} />
            {saveState === 'saving'
              ? 'Guardando…'
              : savedAt
                ? `Guardado · ${new Date(savedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
                : 'Guardado localmente'}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPendingImport(f);
              e.target.value = '';
            }}
          />
        </div>

        {notionHelp && (
          <div className="importbar importbar--info" role="status">
            <Icon name="import" size={13} />
            <span>
              En <b>Notion</b>: Configuración → <b>Exportar</b> → <b>Markdown y CSV</b> → descarga el .zip.
              {' '}Luego:
            </span>
            <button className="importbar__btn importbar__btn--danger" onClick={() => notionFileRef.current?.click()} disabled={notionBusy}>
              {notionBusy ? 'Importando…' : 'Elegir .zip…'}
            </button>
            <input
              ref={notionFileRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              style={{ display: 'none' }}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) confirmNotionImport(f);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {pendingImport && (
          <div className="importbar" role="alert">
            <Icon name="warning" size={13} />
            <span>¿Reemplazar el cuaderno actual con <b>{pendingImport.name}</b>? Las páginas actuales se sobrescriben.</span>
            <button className="importbar__btn importbar__btn--danger" onClick={confirmImport}>Reemplazar</button>
            <button className="importbar__btn" onClick={() => setPendingImport(null)}>Cancelar</button>
          </div>
        )}
        {notice && (
          <div className={`importbar${notice.kind === 'ok' ? ' importbar--ok' : ''}`} role="status">
            <Icon name={notice.kind === 'ok' ? 'check' : 'warning'} size={13} />
            <span>{notice.text}</span>
          </div>
        )}

        <div className="sidebar__foot">
          <button
            className={`trashbtn${showTrash ? ' is-active' : ''}`}
            onClick={() => setShowTrash(!showTrash)}
            aria-pressed={showTrash}
          >
            <Icon name="trash" size={15} />
            Papelera
            {trashCount > 0 && <span className="trashbadge">{trashCount}</span>}
          </button>
          <button
            className="iconbtn"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={() => setTheme(toggleTheme())}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
