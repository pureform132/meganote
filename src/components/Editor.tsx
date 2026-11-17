import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent,
} from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';
import { sanitizeInline, htmlToText, escapeHtml } from '../lib/html';
import { COVERS, COVER_BY_ID, searchPageIcons } from '../lib/pageIcons';
import { SlashMenu, SLASH_COMMANDS, type SlashCommand } from './SlashMenu';
import { newId, type Block, type BlockType, type Page } from '../lib/types';

const LISTISH: BlockType[] = ['bulleted', 'numbered', 'todo', 'toggle'];
const FILE_SIZE_LIMIT = 8 * 1024 * 1024; // 8 MB

function placeholderFor(type: BlockType): string {
  switch (type) {
    case 'text': return 'Escribe, o pulsa / para bloques…';
    case 'h1': return 'Encabezado 1';
    case 'h2': return 'Encabezado 2';
    case 'h3': return 'Encabezado 3';
    case 'bulleted': return 'Elemento de la lista';
    case 'numbered': return 'Elemento de la lista';
    case 'todo': return 'To-do';
    case 'toggle': return 'Desplegable';
    case 'quote': return 'Cita';
    case 'callout': return 'Destacado';
    case 'code': return 'Código…';
    default: return '';
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fragToParts(frag: DocumentFragment) {
  const d = document.createElement('div');
  d.appendChild(frag);
  return { html: sanitizeInline(d.innerHTML), text: (d.textContent ?? '').trim() };
}

/** Extrae el texto antes/después del caret dentro del elemento. Vacía el elemento. */
function splitAtCaret(el: HTMLElement) {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    const post = range.cloneRange();
    post.selectNodeContents(el);
    post.setStart(range.endContainer, range.endOffset);
    const postParts = fragToParts(post.extractContents());
    const pre = document.createRange();
    pre.selectNodeContents(el);
    const preParts = fragToParts(pre.extractContents());
    return { before: preParts, after: postParts };
  }
  const text = el.textContent ?? '';
  return { before: { html: escapeHtml(text), text }, after: { html: '', text: '' } };
}

function caretToEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function preCaretText(el: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return '';
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString();
}

/** Envuelve la selección actual en un <code> en línea. */
function wrapSelectionInCode(el: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) return;
  const frag = range.extractContents();
  const code = document.createElement('code');
  code.appendChild(frag);
  range.insertNode(code);
  const r = document.createRange();
  r.setStartAfter(code);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

export function Editor({ page }: { page: Page }) {
  const {
    pages, updatePage, toggleFavorite, trashPage, byId, setActivePageId,
    createPage, duplicatePage, movePage,
    addBlock, updateBlock, removeBlock, splitBlock, mergeIntoPrevious,
    focusRequest, requestFocus, exportPageMarkdown,
  } = useWorkspace();

  const [slash, setSlash] = useState<{ blockId: string; query: string; selected: number } | null>(null);
  const [iconPick, setIconPick] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const [coverOpen, setCoverOpen] = useState(false);
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [linkPickerFor, setLinkPickerFor] = useState<string | null>(null);
  const [dividerSel, setDividerSel] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<Record<string, string>>({});
  const [slashPos, setSlashPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const blockEls = useRef(new Map<string, HTMLElement>());
  const setBlockRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) blockEls.current.set(id, el);
    else blockEls.current.delete(id);
  }, []);

  // contadores de listas numeradas
  const numbering = useMemo(() => {
    const map = new Map<string, number>();
    const counters = [0, 0, 0, 0, 0];
    for (const b of page.blocks) {
      if (b.type === 'numbered') {
        counters[b.level] += 1;
        map.set(b.id, counters[b.level]);
        for (let l = b.level + 1; l < counters.length; l++) counters[l] = 0;
      } else {
        counters.fill(0);
      }
    }
    return map;
  }, [page.blocks]);

  // visibilidad con toggles cerrados
  const visibleBlocks = useMemo(() => {
    const out: Block[] = [];
    let hideDeeperThan: number | null = null;
    for (const b of page.blocks) {
      if (hideDeeperThan !== null) {
        if (b.level > hideDeeperThan) continue;
        hideDeeperThan = null;
      }
      out.push(b);
      if (b.type === 'toggle' && b.open === false) hideDeeperThan = b.level;
    }
    return out;
  }, [page.blocks]);

  const iconGroups = useMemo(() => searchPageIcons(iconQuery), [iconQuery]);

  const inlineSubpageIds = useMemo(
    () => new Set(page.blocks.filter((b) => b.type === 'subpage' && b.pageId).map((b) => b.pageId!)),
    [page.blocks],
  );
  const extraSubpages = useMemo(
    () => pages.filter((p) => p.parentId === page.id && !p.trashed && !inlineSubpageIds.has(p.id)),
    [pages, page.id, inlineSubpageIds],
  );
  const backlinks = useMemo(
    () =>
      pages.filter(
        (p) =>
          p.id !== page.id &&
          p.blocks.some((b) => b.type === 'pageLink' && b.pageId === page.id),
      ),
    [pages, page.id],
  );
  const childCount = useCallback(
    (targetId: string) => pages.filter((p) => p.parentId === targetId && !p.trashed).length,
    [pages],
  );

  const createSubpage = useCallback(() => {
    const childId = createPage(page.id, 'page');
    addBlock(page.id, {
      id: newId(),
      type: 'subpage',
      text: '',
      html: '',
      level: 0,
      pageId: childId,
    });
    setActivePageId(childId);
  }, [addBlock, createPage, page.id, setActivePageId]);

  // gestión del foco
  useEffect(() => {
    if (!focusRequest) return;
    const wrap = blockEls.current.get(focusRequest.id);
    const inner = wrap?.querySelector<HTMLElement>('.block-content') ?? wrap;
    if (inner) {
      inner.focus();
      caretToEnd(inner);
    }
  }, [focusRequest]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (dividerSel && !t.closest('.divider-row')) setDividerSel(null);
      if (iconPick && !t.closest('.titleicon') && !t.closest('.iconpick')) {
        setIconPick(false);
        setIconQuery('');
      }
      if (pageMenuOpen && !t.closest('.pagemenu-wrap')) setPageMenuOpen(false);
      if (linkPickerFor && !t.closest('.pagelink-picker') && !t.closest('.pagelink-open')) setLinkPickerFor(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [dividerSel, iconPick, pageMenuOpen, linkPickerFor]);

  useEffect(() => {
    if (!dividerSel) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        removeBlock(page.id, dividerSel);
        setDividerSel(null);
      } else if (e.key !== 'Escape') {
        setDividerSel(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dividerSel, page.id, removeBlock]);

  // innerHTML una vez por elemento de bloque (no controlado)
  useLayoutEffect(() => {
    for (const b of page.blocks) {
      const wrap = blockEls.current.get(b.id);
      const inner = wrap?.querySelector<HTMLElement>('.block-content');
      if (inner && document.activeElement !== inner) {
        const clean = b.html || '';
        if (b.type === 'code') {
          if (inner.textContent !== b.text) inner.textContent = b.text;
        } else if (inner.innerHTML !== clean) {
          inner.innerHTML = clean;
        }
      }
    }
  }, [page.blocks, page.id]);

  const filteredSlashCount = useMemo(() => {
    if (!slash) return 0;
    const q = slash.query.trim().toLowerCase();
    if (!q) return SLASH_COMMANDS.length;
    return SLASH_COMMANDS.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q)).length;
  }, [slash]);

  const openSlashAt = useCallback((blockId: string, el: HTMLElement) => {
    const host = rootRef.current?.closest('.main') as HTMLElement | null;
    const hostRect = host?.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setSlashPos({
      top: rect.bottom - (hostRect?.top ?? 0) + (host?.scrollTop ?? 0) + 6,
      left: Math.min(rect.left - (hostRect?.left ?? 0) + (host?.scrollLeft ?? 0), (host?.clientWidth ?? 800) - 300),
    });
    setSlash({ blockId, query: '', selected: 0 });
  }, []);

  const handleInput = useCallback((b: Block, el: HTMLElement) => {
    if (el.innerHTML === '<br>') { el.innerHTML = ''; }
    const text = el.textContent ?? '';
    updateBlock(page.id, b.id, { html: sanitizeInline(el.innerHTML), text });

    if (b.type === 'code') return;
    const pre = preCaretText(el);
    const m = /(^|\s)\/([A-Za-z0-9]*)$/.exec(pre);
    if (m) {
      if (!slash || slash.blockId !== b.id) openSlashAt(b.id, el);
      setSlash((s) => (s ? { ...s, query: m[2], selected: Math.min(s.selected, Math.max(0, filteredSlashCount - 1)) } : s));
    } else if (slash?.blockId === b.id) {
      setSlash(null);
    }
  }, [page.id, updateBlock, slash, openSlashAt, filteredSlashCount]);

  const convertBlock = useCallback((b: Block, cmd: SlashCommand | BlockType) => {
    const type = typeof cmd === 'string' ? cmd : cmd.type;
    const patch: Partial<Block> = { type, html: '', text: '' };
    if (type === 'todo') patch.checked = false;
    if (type === 'toggle') patch.open = true;
    if (type === 'code') patch.lang = 'plain';
    updateBlock(page.id, b.id, patch);
    const wrap = blockEls.current.get(b.id);
    const inner = wrap?.querySelector<HTMLElement>('.block-content');
    if (inner) inner.innerHTML = '';
    setSlash(null);
    if (!['divider', 'image', 'file', 'toc', 'subpage', 'pageLink'].includes(type)) {
      requestFocus(b.id);
    }
  }, [page.id, updateBlock, requestFocus]);

  const applySlashPick = useCallback((cmd: SlashCommand) => {
    const b = page.blocks.find((x) => x.id === slash?.blockId);
    if (!b) { setSlash(null); return; }

    // Una subpágina crea la página hija y deja una tarjeta en el padre.
    const clearEditingDom = () => {
      blockEls.current.get(b.id)?.querySelector<HTMLElement>('.block-content')?.replaceChildren();
    };

    if (cmd.type === 'subpage') {
      const childId = createPage(page.id, 'page');
      clearEditingDom();
      updateBlock(page.id, b.id, { type: 'subpage', pageId: childId, html: '', text: '' });
      setSlash(null);
      setActivePageId(childId);
      return;
    }
    // Un enlace abre el selector de páginas dentro del propio bloque.
    if (cmd.type === 'pageLink') {
      clearEditingDom();
      updateBlock(page.id, b.id, { type: 'pageLink', pageId: undefined, html: '', text: '' });
      setSlash(null);
      setLinkPickerFor(b.id);
      return;
    }
    // El índice no es editable: se calcula solo.
    if (cmd.type === 'toc') {
      clearEditingDom();
      updateBlock(page.id, b.id, { type: 'toc', html: '', text: '' });
      setSlash(null);
      return;
    }

    const wrap = blockEls.current.get(b.id);
    const inner = wrap?.querySelector<HTMLElement>('.block-content');
    const text = inner?.textContent ?? '';
    const stripped = text.replace(/(^|\s)\/[A-Za-z0-9]*$/, '$1');
    convertBlock({ ...b }, cmd);
    if (inner && stripped.trim()) {
      updateBlock(page.id, b.id, { html: escapeHtml(stripped), text: stripped });
      inner.innerHTML = escapeHtml(stripped);
      caretToEnd(inner);
    }
  }, [page.blocks, slash, convertBlock, updateBlock, page.id, createPage, setActivePageId]);

  const focusPrev = useCallback((blocks: Block[], currentId: string) => {
    const i = blocks.findIndex((x) => x.id === currentId);
    const prev = blocks[i - 1];
    if (prev) requestFocus(prev.id);
  }, [requestFocus]);

  const handleKeyDown = (b: Block) => (e: KeyboardEvent<HTMLElement>) => {
    const el = e.currentTarget;

    // navegación del menú slash
    if (slash?.blockId === b.id) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSlash((s) => {
          if (!s) return s;
          const delta = e.key === 'ArrowDown' ? 1 : -1;
          const count = Math.max(1, filteredSlashCount);
          return { ...s, selected: (s.selected + delta + count) % count };
        });
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const q = slash.query.trim().toLowerCase();
        const items = SLASH_COMMANDS.filter((c) => !q || `${c.label} ${c.keywords}`.toLowerCase().includes(q));
        const pick = items[Math.min(slash.selected, items.length - 1)];
        if (pick) applySlashPick(pick);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlash(null);
        return;
      }
    }

    const mod = e.ctrlKey || e.metaKey;

    // formato en línea: Ctrl/Cmd+B negrita, +I itálica, +Shift+X tachado, +` código
    if (mod && b.type !== 'code') {
      const k = e.key.toLowerCase();
      if (k === 'b' && !e.shiftKey) { e.preventDefault(); document.execCommand('bold'); return; }
      if (k === 'i' && !e.shiftKey) { e.preventDefault(); document.execCommand('italic'); return; }
      if (e.shiftKey && k === 'x') { e.preventDefault(); document.execCommand('strikeThrough'); return; }
      if (k === '`') { e.preventDefault(); wrapSelectionInCode(el); return; }
    }

    // bloques de código: Enter =salto de línea, Tab =dos espacios
    if (b.type === 'code') {
      if (e.key === 'Enter' && !mod) {
        e.preventDefault();
        document.execCommand('insertText', false, '\n');
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        return;
      }
      if (e.key === 'Backspace' && (el.textContent ?? '') === '') {
        e.preventDefault();
        removeBlock(page.id, b.id);
        focusPrev(page.blocks, b.id);
        return;
      }
      return;
    }

    if (e.key === 'Enter' && !mod) {
      if (e.shiftKey) { e.preventDefault(); document.execCommand('insertLineBreak'); return; }
      e.preventDefault();
      const { before, after } = splitAtCaret(el);
      el.innerHTML = before.html;
      const newId2 = splitBlock(page.id, b.id, before.html, before.text, after.html, after.text);
      requestFocus(newId2);
      return;
    }

    if (e.key === 'Backspace') {
      const empty = (el.textContent ?? '') === '';
      if (empty) {
        e.preventDefault();
        if (b.type !== 'text') {
          updateBlock(page.id, b.id, { type: 'text', html: '', text: '' });
        } else {
          removeBlock(page.id, b.id);
          focusPrev(page.blocks, b.id);
        }
        return;
      }
      const pre = preCaretText(el);
      if (pre.length === 0) {
        if (LISTISH.includes(b.type) && b.level > 0) {
          e.preventDefault();
          updateBlock(page.id, b.id, { level: b.level - 1 });
          return;
        }
        e.preventDefault();
        mergeIntoPrevious(page.id, b.id);
        focusPrev(page.blocks, b.id);
        return;
      }
    }

    if (e.key === 'Tab' && LISTISH.includes(b.type)) {
      e.preventDefault();
      const delta = e.shiftKey ? -1 : 1;
      const next = Math.min(4, Math.max(0, b.level + delta));
      updateBlock(page.id, b.id, { level: next });
      return;
    }

    // atajos tipo Markdown al inicio del bloque, con espacio
    if (e.key === ' ') {
      const pre = preCaretText(el);
      const rules: Record<string, BlockType> = {
        '#': 'h1', '##': 'h2', '###': 'h3', '-': 'bulleted', '*': 'bulleted', '1.': 'numbered',
        '[]': 'todo', '>': 'quote', '```': 'code',
      };
      const target = rules[pre];
      if (target) {
        e.preventDefault();
        const patch: Partial<Block> = { type: target, html: '', text: '' };
        if (target === 'todo') patch.checked = false;
        if (target === 'code') patch.lang = 'plain';
        updateBlock(page.id, b.id, patch);
        el.innerHTML = '';
        return;
      }
    }
  };

  const handleBlur = (b: Block) => (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (b.type === 'code') return; // el código conserva texto crudo
    const clean = sanitizeInline(el.innerHTML);
    if (clean !== el.innerHTML) el.innerHTML = clean;
    updateBlock(page.id, b.id, { html: clean, text: htmlToText(clean) });
  };

  // migas de pan (ancestros)
  const crumbs: Page[] = [];
  {
    let cur: Page | undefined = page;
    const seen = new Set<string>();
    while (cur?.parentId && !seen.has(cur.parentId)) {
      seen.add(cur.parentId);
      cur = byId.get(cur.parentId);
      if (cur) crumbs.unshift(cur);
    }
  }

  const downloadDataUrl = (name: string, dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className={`editor${page.cover ? ' has-cover' : ''}`} ref={rootRef} style={{ position: 'relative' }}>
      {page.cover && COVER_BY_ID.get(page.cover) && (
        <div className={`pagecover ${COVER_BY_ID.get(page.cover)!.className}`}>
          <div className="pagecover__actions">
            <button className="coverbtn" onClick={() => setCoverOpen(true)}>
              <Icon name="cover" size={13} /> Cambiar
            </button>
            <button className="coverbtn" onClick={() => updatePage(page.id, { cover: undefined })}>
              <Icon name="x" size={13} /> Quitar
            </button>
          </div>
        </div>
      )}

      <div className="pagecrumb">
        <Icon name="notebook" size={13} />
        {crumbs.length > 0 ? (
          <>
            {crumbs.map((p) => (
              <button
                key={p.id}
                className="crumb-link"
                onClick={() => setActivePageId(p.id)}
                title={`Ir a ${p.title || 'Sin título'}`}
              >
                {p.title || 'Sin título'}
              </button>
            ))}
            <span className="crumb-sep" aria-hidden="true">›</span>
            <span>{page.title || 'Sin título'}</span>
          </>
        ) : (
          <span>Cuaderno <span aria-hidden="true">›</span> {page.title || 'Sin título'}</span>
        )}
        <span style={{ flex: 1 }} />
        <div className="pagemenu-wrap">
          <button
            className="rowaction"
            title="Más acciones de la página"
            aria-label="Más acciones de la página"
            aria-expanded={pageMenuOpen}
            aria-haspopup="menu"
            onClick={() => setPageMenuOpen((v) => !v)}
          >
            <Icon name="more" size={17} />
          </button>
          {pageMenuOpen && (
            <div className="pagemenu" role="menu" aria-label="Acciones de la página">
              <button role="menuitem" onClick={() => { duplicatePage(page.id); setPageMenuOpen(false); }}>
                <Icon name="copy" size={15} /> Duplicar página
              </button>
              <button role="menuitem" onClick={() => { setMoveOpen(true); setPageMenuOpen(false); }}>
                <Icon name="move" size={15} /> Mover a…
              </button>
              <button role="menuitem" onClick={() => { setCoverOpen(true); setPageMenuOpen(false); }}>
                <Icon name="cover" size={15} /> {page.cover ? 'Cambiar portada' : 'Añadir portada'}
              </button>
              {page.cover && (
                <button role="menuitem" onClick={() => { updatePage(page.id, { cover: undefined }); setPageMenuOpen(false); }}>
                  <Icon name="x" size={15} /> Quitar portada
                </button>
              )}
            </div>
          )}
        </div>
        <button className="rowaction" title="Descargar página como Markdown" onClick={() => exportPageMarkdown(page.id)} aria-label="Descargar página como Markdown">
          <Icon name="export" size={15} />
        </button>
        <button className="rowaction" title={page.favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'} onClick={() => toggleFavorite(page.id)} aria-label="Alternar favorito">
          <Icon name="star" size={15} filled={page.favorite} />
        </button>
        <button className="rowaction" title="Mover a la papelera" onClick={() => trashPage(page.id)} aria-label="Mover página a la papelera">
          <Icon name="trash" size={15} />
        </button>
      </div>

      <div className="titlerow">
        <div className="titleicon">
          <button
            className="titleicon"
            style={{ border: 'none', background: 'transparent' }}
            onClick={() => setIconPick((v) => !v)}
            aria-label="Cambiar sticker de página"
            aria-expanded={iconPick}
          >
            <Icon name={(page.icon || 'doc') as IconName} size={26} />
          </button>
          {iconPick && (
            <div className="iconpick" role="dialog" aria-label="Elegir sticker de página">
              <div className="iconpick__search">
                <Icon name="search" size={14} />
                <input
                  autoFocus
                  value={iconQuery}
                  onChange={(e) => setIconQuery(e.target.value)}
                  placeholder="Buscar sticker…"
                  aria-label="Buscar sticker"
                />
                <span className="iconpick__count">{iconGroups.reduce((n, g) => n + g.icons.length, 0)}</span>
              </div>
              <div className="iconpick__scroll">
                {iconGroups.map((group) => (
                  <div key={group.name} className="iconpick__group">
                    <p className="iconpick__groupname">{group.name}</p>
                    <div className="iconpick__grid">
                      {group.icons.map((ic) => (
                        <button
                          key={ic.id}
                          className={page.icon === ic.id ? 'is-sel' : ''}
                          title={ic.label}
                          aria-label={`Sticker ${ic.label}`}
                          onClick={() => {
                            updatePage(page.id, { icon: ic.id });
                            setIconPick(false);
                            setIconQuery('');
                          }}
                        >
                          <Icon name={ic.id} size={19} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {iconGroups.length === 0 && <p className="iconpick__empty">Ningún sticker coincide con “{iconQuery}”.</p>}
              </div>
            </div>
          )}
        </div>
        <input
          className="titleinput"
          value={page.title}
          placeholder="Sin título"
          aria-label="Título de la página"
          onChange={(e) => updatePage(page.id, { title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && page.blocks[0]) {
              e.preventDefault();
              requestFocus(page.blocks[0].id);
            }
          }}
        />
        <button
          className="btn-ghost subpageadd"
          onClick={createSubpage}
          title="Crear una página dentro de esta página"
        >
          <Icon name="subpage" size={14} /> Subpágina
        </button>
      </div>

      <div className="blocks">
        {visibleBlocks.map((b) => {
          // El tipo forma parte de la key: al convertir un bloque, React lo remonta
          // y no conserva el DOM editable anterior (p. ej. el texto "/toc").
          const key = `${b.id}:${b.type}`;
          const level = Math.min(4, Math.max(0, b.level));

          if (b.type === 'divider') {
            return (
              <div key={key} className="block" data-level={level}>
                <button
                  className={`divider-row${dividerSel === b.id ? ' is-selected' : ''}`}
                  onClick={() => setDividerSel(b.id)}
                  aria-label="Divisor — púlsalo para borrarlo"
                >
                  <hr />
                </button>
              </div>
            );
          }

          if (b.type === 'image') {
            return (
              <div key={key} className="block imgblock" data-level={level} ref={setBlockRef(b.id)}>
                {b.src ? (
                  <figure>
                    <img src={b.src} alt={b.alt ?? ''} />
                    <div className="imgbar">
                      <input
                        className="imgcaption"
                        placeholder="Descripción…"
                        value={b.alt ?? ''}
                        onChange={(e) => updateBlock(page.id, b.id, { alt: e.target.value })}
                        aria-label="Descripción de la imagen"
                      />
                      <button className="rowaction" title="Quitar imagen" aria-label="Quitar imagen" onClick={() => removeBlock(page.id, b.id)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </figure>
                ) : (
                  <ImageUploader
                    onInsert={(src) => updateBlock(page.id, b.id, { src, alt: '' })}
                    error={imageErr[b.id]}
                    onError={(msg) => setImageErr((m) => ({ ...m, [b.id]: msg }))}
                  />
                )}
              </div>
            );
          }

          if (b.type === 'file') {
            return (
              <div key={key} className="block fileblock" data-level={level} ref={setBlockRef(b.id)}>
                {b.src ? (
                  <div className="filechip">
                    <span className="filechip__ic"><Icon name="file" size={20} /></span>
                    <span className="filechip__meta">
                      <span className="filechip__name">{b.fileName ?? 'archivo'}</span>
                      <span className="filechip__sub">{b.fileSize ? formatBytes(b.fileSize) : ''}{b.fileMime ? ` · ${b.fileMime.split('/').pop()}` : ''}</span>
                    </span>
                    <button className="filechip__btn" onClick={() => downloadDataUrl(b.fileName ?? 'archivo', b.src!)}>
                      <Icon name="download" size={13} /> Descargar
                    </button>
                    <button className="rowaction" title="Quitar archivo" aria-label="Quitar archivo" onClick={() => removeBlock(page.id, b.id)}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ) : (
                  <FileUploader
                    error={imageErr[b.id]}
                    onError={(msg) => setImageErr((m) => ({ ...m, [b.id]: msg }))}
                    onInsert={(src, fileName, fileSize, fileMime) =>
                      updateBlock(page.id, b.id, { src, fileName, fileSize, fileMime })
                    }
                  />
                )}
              </div>
            );
          }

          if (b.type === 'toc') {
            const heads = page.blocks.filter((x) => x.type === 'h1' || x.type === 'h2' || x.type === 'h3');
            return (
              <div key={key} className="block block--toc" data-level={level} ref={setBlockRef(b.id)}>
                <div className="toc">
                  <div className="toc__head">
                    <span><Icon name="toc" size={14} /> Tabla de contenido</span>
                    <button className="rowaction" title="Quitar índice" aria-label="Quitar tabla de contenido" onClick={() => removeBlock(page.id, b.id)}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                  {heads.length > 0 ? (
                    <div className="toc__list">
                      {heads.map((h) => (
                        <button
                          key={h.id}
                          className={`toc__item toc__item--${h.type}`}
                          onClick={() => {
                            blockEls.current.get(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            requestFocus(h.id);
                          }}
                        >
                          {htmlToText(h.html || h.text) || 'Sin título'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="toc__empty">Añade encabezados H1–H3 y aparecerán aquí.</p>
                  )}
                </div>
              </div>
            );
          }

          if (b.type === 'subpage') {
            const target = b.pageId ? byId.get(b.pageId) : undefined;
            const usable = !!target && !target.trashed;
            return (
              <div key={key} className="block subpageblock" data-level={level} ref={setBlockRef(b.id)}>
                <div className={`subpagecard${usable ? '' : ' is-missing'}`}>
                  <button
                    className="subpagecard__main"
                    disabled={!usable}
                    onClick={() => target && usable && setActivePageId(target.id)}
                    aria-label={usable ? `Abrir subpágina ${target.title || 'Sin título'}` : 'Subpágina no disponible'}
                  >
                    <span className="subpagecard__ic">
                      <Icon name={((usable && target.icon) || 'subpage') as IconName} size={21} />
                    </span>
                    <span className="subpagecard__body">
                      <span className="subpagecard__title">
                        {usable ? (target.title || 'Sin título') : 'Subpágina no encontrada'}
                      </span>
                      <span className="subpagecard__meta">
                        {usable
                          ? `Subpágina · ${childCount(target.id)} ${childCount(target.id) === 1 ? 'hija' : 'hijas'} · editada ${new Date(target.updated).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
                          : 'La página se movió a la papelera o se eliminó'}
                      </span>
                    </span>
                    {usable && <Icon name="arrowRight" size={16} />}
                  </button>
                  <button
                    className="rowaction"
                    title="Quitar tarjeta (la subpágina sigue en el árbol)"
                    aria-label="Quitar tarjeta de subpágina"
                    onClick={() => removeBlock(page.id, b.id)}
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              </div>
            );
          }

          if (b.type === 'pageLink') {
            const target = b.pageId ? byId.get(b.pageId) : undefined;
            const usable = !!target && !target.trashed;
            return (
              <div key={key} className="block pagelinkblock" data-level={level} ref={setBlockRef(b.id)}>
                {!b.pageId || linkPickerFor === b.id ? (
                  <div className="pagelink-wrap">
                    <button className="pagelink-open" onClick={() => setLinkPickerFor(b.id)}>
                      <Icon name="pageLink" size={15} /> {b.pageId ? 'Elegir otra página…' : 'Elegir página…'}
                    </button>
                    {linkPickerFor === b.id && (
                      <PageLinkPicker
                        pages={pages}
                        excludeId={page.id}
                        onPick={(targetId) => {
                          updateBlock(page.id, b.id, { pageId: targetId });
                          setLinkPickerFor(null);
                        }}
                        onClose={() => setLinkPickerFor(null)}
                      />
                    )}
                  </div>
                ) : (
                  <div className={`pagelinkchip${usable ? '' : ' is-missing'}`}>
                    <button
                      className="pagelinkchip__main"
                      disabled={!usable}
                      onClick={() => usable && target && setActivePageId(target.id)}
                    >
                      <span className="pagelinkchip__ic">
                        <Icon name={((usable && target.icon) || 'pageLink') as IconName} size={16} />
                      </span>
                      <span className="pagelinkchip__title">
                        {usable ? (target.title || 'Sin título') : 'Página no disponible'}
                      </span>
                      <span className="pagelinkchip__label">Enlace a página</span>
                    </button>
                    <button className="rowaction" title="Quitar enlace" aria-label="Quitar enlace a página" onClick={() => removeBlock(page.id, b.id)}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          }

          const content = (
            <div
              className="block-content"
              contentEditable
              suppressContentEditableWarning
              spellCheck
              role="textbox"
              aria-multiline="true"
              aria-label={`Bloque ${b.type}`}
              data-placeholder={placeholderFor(b.type)}
              onInput={(e) => handleInput(b, e.currentTarget)}
              onKeyDown={handleKeyDown(b)}
              onBlur={handleBlur(b)}
            />
          );

          switch (b.type) {
            case 'bulleted':
              return (
                <div key={key} className="block block--bulleted" data-level={level} ref={setBlockRef(b.id)}>
                  <span className="bulleted-dot" aria-hidden="true"><i /></span>
                  {content}
                </div>
              );
            case 'numbered':
              return (
                <div key={key} className="block block--numbered" data-level={level} ref={setBlockRef(b.id)}>
                  <span className="listitem-marker" aria-hidden="true">{numbering.get(b.id)}.</span>
                  {content}
                </div>
              );
            case 'todo':
              return (
                <div key={key} className="block block--todo" data-level={level} ref={setBlockRef(b.id)}>
                  <button
                    className={`todocheck${b.checked ? ' is-checked' : ''}`}
                    onClick={() => updateBlock(page.id, b.id, { checked: !b.checked })}
                    role="checkbox"
                    aria-checked={!!b.checked}
                    aria-label={b.checked ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  >
                    <Icon name="check" size={13} strokeWidth={2.4} />
                  </button>
                  <div className={`todo-text${b.checked ? ' is-done' : ''}`} style={{ flex: 1, minWidth: 0 }}>
                    {content}
                  </div>
                </div>
              );
            case 'toggle':
              return (
                <div key={key} className="block block--toggle" data-level={level} ref={setBlockRef(b.id)}>
                  <button
                    className="togglebtn"
                    data-open={b.open !== false}
                    onClick={() => updateBlock(page.id, b.id, { open: b.open === false })}
                    aria-label={b.open === false ? 'Expandir desplegable' : 'Contraer desplegable'}
                    aria-expanded={b.open !== false}
                  >
                    <Icon name="chevronRight" size={15} />
                  </button>
                  {content}
                </div>
              );
            case 'quote':
              return (
                <div key={key} className="block block--quote" data-level={level} ref={setBlockRef(b.id)}>
                  {content}
                </div>
              );
            case 'callout':
              return (
                <div key={key} className="block block--callout" data-level={level} ref={setBlockRef(b.id)}>
                  <div className="block-body">
                    <Icon name="info" size={17} className="callout-ic" />
                    {content}
                  </div>
                </div>
              );
            case 'code':
              return (
                <div key={key} className="block block--code" data-level={level} ref={setBlockRef(b.id)}>
                  <div className="codehead">
                    <input
                      className="codelang"
                      value={b.lang ?? 'plain'}
                      onChange={(e) => updateBlock(page.id, b.id, { lang: e.target.value.slice(0, 24) })}
                      aria-label="Lenguaje del código"
                      spellCheck={false}
                    />
                  </div>
                  {content}
                </div>
              );
            default: {
              const cls = b.type === 'text' ? '' : b.type;
              return (
                <div key={key} className={`block ${cls ? `block--${cls}` : ''}`} data-level={level} ref={setBlockRef(b.id)}>
                  {content}
                </div>
              );
            }
          }
        })}
      </div>

      {extraSubpages.length > 0 && (
        <section className="childpages" aria-label="Páginas dentro de esta página">
          <div className="childpages__head">
            <p className="sectionlabel"><Icon name="subpage" size={14} /> Páginas dentro de esta página</p>
            <button className="btn-ghost btn-ghost--small" onClick={createSubpage}>
              <Icon name="plus" size={12} /> Nueva
            </button>
          </div>
          <div className="childgrid">
            {extraSubpages.map((child) => (
              <button key={child.id} className="childcard" onClick={() => setActivePageId(child.id)}>
                <span className="childcard__ic">
                  <Icon name={(child.icon || 'doc') as IconName} size={18} />
                </span>
                <span className="childcard__body">
                  <span className="childcard__title">{child.title || 'Sin título'}</span>
                  <span className="childcard__meta">
                    {childCount(child.id)} {childCount(child.id) === 1 ? 'subpágina' : 'subpáginas'} · {new Date(child.updated).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </span>
                </span>
                <Icon name="arrowRight" size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {backlinks.length > 0 && (
        <section className="backlinks" aria-label="Páginas que mencionan esta página">
          <p className="sectionlabel"><Icon name="backlink" size={14} /> Mencionada en</p>
          <div className="backlinklist">
            {backlinks.map((source) => (
              <button key={source.id} className="backlinkitem" onClick={() => setActivePageId(source.id)}>
                <Icon name={(source.icon || 'doc') as IconName} size={15} />
                <span>{source.title || 'Sin título'}</span>
                <Icon name="arrowRight" size={13} />
              </button>
            ))}
          </div>
        </section>
      )}

      {coverOpen && (
        <CoverPicker
          current={page.cover}
          onPick={(cover) => { updatePage(page.id, { cover }); setCoverOpen(false); }}
          onRemove={() => { updatePage(page.id, { cover: undefined }); setCoverOpen(false); }}
          onClose={() => setCoverOpen(false)}
        />
      )}

      {moveOpen && (
        <MoveDialog
          page={page}
          pages={pages}
          onMove={(parentId) => {
            if (movePage(page.id, parentId)) setMoveOpen(false);
          }}
          onClose={() => setMoveOpen(false)}
        />
      )}

      {slash && (
        <SlashMenu
          query={slash.query}
          selected={slash.selected}
          onHover={(i) => setSlash((s) => (s ? { ...s, selected: i } : s))}
          onPick={applySlashPick}
          style={{ top: slashPos.top, left: slashPos.left }}
        />
      )}
    </div>
  );
}

function descendantIds(pages: Page[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of pages) {
      if (p.parentId && ids.has(p.parentId) && !ids.has(p.id)) {
        ids.add(p.id);
        grew = true;
      }
    }
  }
  return ids;
}

function PageLinkPicker({
  pages,
  excludeId,
  onPick,
  onClose,
}: {
  pages: Page[];
  excludeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = pages
    .filter((p) => p.id !== excludeId && !p.trashed)
    .filter((p) => !q || `${p.title || 'Sin título'}`.toLowerCase().includes(q))
    .slice(0, 8);

  return (
    <div className="pagelink-picker" role="dialog" aria-label="Elegir una página para enlazar">
      <div className="pagelink-picker__search">
        <Icon name="search" size={13} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar página…"
          aria-label="Buscar página para enlazar"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && items[0]) onPick(items[0].id);
          }}
        />
      </div>
      <div className="pagelink-picker__list">
        {items.length === 0 && <p className="pagelink-picker__empty">No hay otra página con ese nombre.</p>}
        {items.map((p) => (
          <button key={p.id} onClick={() => onPick(p.id)}>
            <Icon name={(p.icon || 'doc') as IconName} size={14} />
            <span>{p.title || 'Sin título'}</span>
            <Icon name="arrowRight" size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}

function CoverPicker({
  current,
  onPick,
  onRemove,
  onClose,
}: {
  current?: string;
  onPick: (id: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Elegir portada">
      <div className="modal coverpick" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <p className="kicker">Portada de página</p>
            <h2>Elige un tono.</h2>
          </div>
          <button className="rowaction" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={16} />
          </button>
        </div>
        <p className="modal__lede">Portadas dibujadas con los cuatro matices del cuaderno. Sin imágenes externas.</p>
        <div className="covergrid">
          {COVERS.map((cover) => (
            <button
              key={cover.id}
              className={`coverchoice${current === cover.id ? ' is-sel' : ''}`}
              onClick={() => onPick(cover.id)}
              aria-label={`Portada ${cover.label}`}
            >
              <span className={`coverswatch ${cover.className}`} />
              <span>{cover.label}</span>
              {current === cover.id && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
        {current && (
          <button className="btn-ghost modal__remove" onClick={onRemove}>
            <Icon name="x" size={13} /> Quitar portada
          </button>
        )}
      </div>
    </div>
  );
}

function MoveDialog({
  page,
  pages,
  onMove,
  onClose,
}: {
  page: Page;
  pages: Page[];
  onMove: (parentId: string | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const blocked = useMemo(() => descendantIds(pages, page.id), [pages, page.id]);
  const tree = useMemo(() => {
    const byParent = new Map<string | null, Page[]>();
    for (const p of pages) {
      if (p.trashed) continue;
      const key = p.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(p);
    }
    const out: { page: Page; depth: number }[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const p of byParent.get(parentId) ?? []) {
        out.push({ page: p, depth });
        walk(p.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [pages]);

  const q = query.trim().toLowerCase();
  const items = tree.filter(
    ({ page: p }) => !blocked.has(p.id) && (!q || `${p.title || 'Sin título'}`.toLowerCase().includes(q)),
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Mover página">
      <div className="modal movepick" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <p className="kicker">Mover página</p>
            <h2>¿Dónde va «{page.title || 'Sin título'}»?</h2>
          </div>
          <button className="rowaction" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="movepick__search">
          <Icon name="search" size={14} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar una página de destino…"
            aria-label="Buscar página de destino"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && items[0]) onMove(items[0].page.id);
            }}
          />
        </div>
        <div className="movepick__list" role="listbox" aria-label="Páginas de destino">
          <button
            className={`movepick__item${page.parentId === null ? ' is-current' : ''}`}
            onClick={() => onMove(null)}
          >
            <Icon name="notebook" size={15} />
            <span>Nivel raíz del cuaderno</span>
            {page.parentId === null && <Icon name="check" size={13} />}
          </button>
          {items.map(({ page: p, depth }) => (
            <button
              key={p.id}
              className={`movepick__item${page.parentId === p.id ? ' is-current' : ''}`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
              onClick={() => onMove(p.id)}
            >
              <Icon name={(p.icon || 'doc') as IconName} size={14} />
              <span>{p.title || 'Sin título'}</span>
              {page.parentId === p.id && <Icon name="check" size={13} />}
            </button>
          ))}
          {items.length === 0 && <p className="movepick__empty">No hay destinos con ese nombre.</p>}
        </div>
        <p className="modal__hint">Una página no puede moverse dentro de sí misma ni de sus subpáginas.</p>
      </div>
    </div>
  );
}

function ImageUploader({
  onInsert,
  onError,
  error,
}: {
  onInsert: (src: string) => void;
  onError?: (msg: string) => void;
  error?: string;
}) {
  const [url, setUrl] = useState('');
  return (
    <div className="imgpick">
      <Icon name="image" size={17} />
      <input
        type="url"
        placeholder="Pega una URL de imagen…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        aria-label="URL de la imagen"
      />
      <button className="filebtn" onClick={() => url.trim() && onInsert(url.trim())} disabled={!url.trim()}>
        Insertar
      </button>
      <label className="filebtn">
        Subir
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 1_600_000) {
              onError?.('Mantén las imágenes por debajo de ~1.5 MB — se guardan localmente en tu navegador.');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => onInsert(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {error && <span className="errormsg">{error}</span>}
    </div>
  );
}

function FileUploader({
  onInsert,
  onError,
  error,
}: {
  onInsert: (src: string, fileName: string, fileSize: number, fileMime: string) => void;
  onError?: (msg: string) => void;
  error?: string;
}) {
  return (
    <div className="imgpick">
      <Icon name="file" size={17} />
      <label className="filebtn">
        Elegir archivo…
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > FILE_SIZE_LIMIT) {
              onError?.('Máximo 8 MB por archivo — se guarda en el almacenamiento local.');
              return;
            }
            const reader = new FileReader();
            reader.onload = () =>
              onInsert(String(reader.result), file.name, file.size, file.type || 'application/octet-stream');
            reader.readAsDataURL(file);
          }}
        />
      </label>
      <span style={{ fontSize: 11.5, color: 'var(--ink-55)' }}>Cualquier tipo · máx. 8 MB</span>
      {error && <span className="errormsg">{error}</span>}
    </div>
  );
}
