import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent,
} from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, PAGE_ICONS, type IconName } from '../lib/icons';
import { sanitizeInline, htmlToText, escapeHtml } from '../lib/html';
import { SlashMenu, SLASH_COMMANDS, type SlashCommand } from './SlashMenu';
import type { Block, BlockType, Page } from '../lib/types';

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
    updatePage, toggleFavorite, trashPage, byId,
    updateBlock, removeBlock, addBlock, splitBlock, mergeIntoPrevious,
    focusRequest, requestFocus, exportPageMarkdown,
    setActivePageId, createPage, historyVersion,
  } = useWorkspace();

  const [slash, setSlash] = useState<{ blockId: string; query: string; selected: number } | null>(null);
  const [iconPick, setIconPick] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
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
      if (iconPick && !t.closest('.titleicon')) setIconPick(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [dividerSel, iconPick]);

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
  const lastHistoryRef = useRef(historyVersion);
  useLayoutEffect(() => {
    const force = historyVersion !== lastHistoryRef.current; // deshacer/rehacer → resincronizar aunque tenga foco
    lastHistoryRef.current = historyVersion;
    for (const b of page.blocks) {
      const wrap = blockEls.current.get(b.id);
      const inner = wrap?.querySelector<HTMLElement>('.block-content');
      if (!inner) continue;
      const focused = document.activeElement === inner;
      if (force || !focused) {
        const clean = b.html || '';
        if (b.type === 'code') {
          if (inner.textContent !== b.text) inner.textContent = b.text;
        } else if (inner.innerHTML !== clean) {
          inner.innerHTML = clean;
        }
        if (force && focused) caretToEnd(inner);
      }
    }
  }, [page.blocks, page.id, historyVersion]);

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
    if (type !== 'divider' && type !== 'image' && type !== 'file') {
      requestFocus(b.id);
    }
  }, [page.id, updateBlock, requestFocus]);

  const applySlashPick = useCallback((cmd: SlashCommand) => {
    const b = page.blocks.find((x) => x.id === slash?.blockId);
    if (!b) { setSlash(null); return; }
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
  }, [page.blocks, slash, convertBlock, updateBlock, page.id]);

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

  // subpáginas (como en Notion: se listan dentro de la página)
  const subPages = useMemo(
    () => [...byId.values()].filter((p) => p.parentId === page.id && !p.trashed),
    [byId, page.id],
  );

  // clic en cualquier parte del lienzo → escribe ahí (estilo Notion)
  const handleCanvasClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const interactive = t.closest(
      '.block-content, input, textarea, button, a, label, select, .slashmenu, .iconpick, .cellopts, .colmenu, .palette, .pagecrumb, .subpages, .imgpick',
    );
    if (interactive) return;
    if (t.closest('.block')) return; // ya lo gestiona el propio bloque
    let nearest: string | null = null;
    let nearestDist = Infinity;
    let belowAll = true;
    for (const [id, el] of blockEls.current) {
      const r = el.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        requestFocus(id);
        return;
      }
      if (e.clientY < r.bottom) belowAll = false;
      const d = e.clientY < r.top ? r.top - e.clientY : e.clientY - r.bottom;
      if (d < nearestDist) { nearestDist = d; nearest = id; }
    }
    const last = visibleBlocks[visibleBlocks.length - 1];
    const lastEl = last ? blockEls.current.get(last.id) : undefined;
    const lastBottom = lastEl?.getBoundingClientRect().bottom ?? 0;
    if (belowAll && (!lastEl || e.clientY > lastBottom + 36)) {
      addBlock(page.id, last?.id ?? null);
      return;
    }
    if (nearest) requestFocus(nearest);
    else if (last) requestFocus(last.id);
  };

  const downloadDataUrl = (name: string, dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="editor" ref={rootRef} style={{ position: 'relative' }} onMouseDown={handleCanvasClick}>
      <div className="pagecrumb">
        <Icon name="notebook" size={13} />
        {crumbs.length > 0 ? (
          <>
            {crumbs.map((p) => (
              <span key={p.id}>
                <b>{p.title || 'Sin título'}</b> <span aria-hidden="true">›</span>{' '}
              </span>
            ))}
            <span>{page.title || 'Sin título'}</span>
          </>
        ) : (
          <span>Cuaderno <span aria-hidden="true">›</span> {page.title || 'Sin título'}</span>
        )}
        <span style={{ flex: 1 }} />
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
            aria-label="Cambiar icono de página"
            aria-expanded={iconPick}
          >
            <Icon name={(page.icon || 'doc') as IconName} size={24} />
          </button>
          {iconPick && (
            <div className="iconpick" role="menu" aria-label="Elegir icono de la página">
              <input
                className="iconpick__search"
                autoFocus
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="Buscar icono…"
                aria-label="Buscar icono"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setIconPick(false); setIconQuery(''); }
                }}
              />
              <div className="iconpick__grid">
                {PAGE_ICONS.filter((ic) => !iconQuery.trim() || ic.toLowerCase().includes(iconQuery.trim().toLowerCase())).map((ic) => (
                  <button
                    key={ic}
                    role="menuitem"
                    className={`iconpick__item${page.icon === ic ? ' is-active' : ''}`}
                    onClick={() => { updatePage(page.id, { icon: ic }); setIconPick(false); setIconQuery(''); }}
                    title={ic}
                    aria-label={`Icono ${ic}`}
                  >
                    <Icon name={ic} size={18} />
                  </button>
                ))}
                {PAGE_ICONS.filter((ic) => !iconQuery.trim() || ic.toLowerCase().includes(iconQuery.trim().toLowerCase())).length === 0 && (
                  <p className="iconpick__empty">Ningún icono coincide con “{iconQuery}”.</p>
                )}
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
      </div>

      <div className="blocks">
        {visibleBlocks.map((b) => {
          const key = b.id;
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

      <div className="canvas-tail" aria-hidden="true" />

      {/* subpáginas — visibles siempre, como en Notion */}
      <div className="subpages" aria-label="Subpáginas">
        <div className="subpages__head">
          <span className="subpages__label">Subpáginas</span>
          <button className="subpages__add" onClick={() => createPage(page.id, 'page')} title="Crear una subpágina aquí">
            <Icon name="plus" size={12} /> Nueva subpágina
          </button>
        </div>
        {subPages.length > 0 ? (
          <div className="subpages__grid">
            {subPages.map((p) => (
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
