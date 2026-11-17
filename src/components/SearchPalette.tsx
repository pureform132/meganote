import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';
import { htmlToText, escapeHtml } from '../lib/html';
import type { Page } from '../lib/types';

interface Hit {
  page: Page;
  score: number;
  snippet: string | null;
}

function subsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return false;
}

function rank(p: Page, q: string): Hit | null {
  const title = (p.title || 'Sin título').toLowerCase();
  let score = 0;
  if (title.includes(q)) score = 1000 - title.indexOf(q);
  else if (subsequence(q, title)) score = 400;
  else score = 0;

  let snippet: string | null = null;
  for (const b of p.blocks) {
    if (b.type === 'divider' || b.type === 'image') continue;
    const t = htmlToText(b.html || b.text);
    const i = t.toLowerCase().indexOf(q);
    if (i >= 0) {
      score = Math.max(score, 700 - i);
      const start = Math.max(0, i - 36);
      const end = Math.min(t.length, i + q.length + 60);
      snippet = (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
      break;
    }
  }

  // filas de bases de datos
  if (p.kind === 'database' && p.db) {
    for (const r of p.db.rows) {
      const text = Object.entries(r.cells)
        .map(([cid, v]) => {
          if (v === null || v === undefined || v === '') return '';
          const col = p.db!.columns.find((c) => c.id === cid);
          if (!col) return String(v);
          if (col.type === 'select') return col.options?.find((o) => o.id === v)?.label ?? String(v);
          if (col.type === 'checkbox') return v ? 'sí' : '';
          return String(v);
        })
        .join(' ')
        .toLowerCase();
      const i = text.indexOf(q);
      if (i >= 0) {
        score = Math.max(score, 650 - i);
        const start = Math.max(0, i - 36);
        const end = Math.min(text.length, i + q.length + 60);
        snippet = 'Fila · ' + (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
        break;
      }
    }
  }
  if (score <= 0) return null;
  return { page: p, score, snippet };
}

export function SearchPalette() {
  const { pages, searchOpen, setSearchOpen, setActivePageId, setShowTrash } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setSelected(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen]);

  const results: Hit[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...pages]
        .sort((a, b) => b.updated - a.updated)
        .slice(0, 6)
        .map((page) => ({ page, score: 1, snippet: null }));
    }
    return pages
      .map((p) => rank(p, q))
      .filter((h): h is Hit => h !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9);
  }, [pages, query]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('.is-sel')?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!searchOpen) return null;

  const open = (pageId: string) => {
    setActivePageId(pageId);
    setShowTrash(false);
    setSearchOpen(false);
  };

  const q = query.trim();
  const highlight = (text: string) => {
    if (!q) return escapeHtml(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>' +
      escapeHtml(text.slice(idx + q.length))
    );
  };

  return (
    <div className="palette-backdrop" onMouseDown={() => setSearchOpen(false)} role="dialog" aria-modal="true" aria-label="Buscar páginas">
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette__inputrow">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            className="palette__input"
            value={query}
            placeholder="Buscar en páginas y bloques…"
            aria-label="Buscar páginas"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(Math.max(0, results.length - 1), s + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(0, s - 1)); }
              else if (e.key === 'Enter' && results[selected]) { e.preventDefault(); open(results[selected].page.id); }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette__list" ref={listRef} role="listbox">
          {results.length === 0 && <p className="palette__empty">Nada coincide con “{query}”.<br />Prueba con menos letras o revisa la papelera.</p>}
          {!q && results.length > 0 && <p className="slash__head" style={{ padding: '6px 10px 2px' }}>Recientes</p>}
          {results.map((h, i) => (
            <button
              key={h.page.id}
              role="option"
              aria-selected={i === selected}
              className={`palette__item${i === selected ? ' is-sel' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => open(h.page.id)}
            >
              <span className="pi-ic"><Icon name={(h.page.icon || 'doc') as IconName} size={16} /></span>
              <span style={{ minWidth: 0 }}>
                <span className="pi-title">{h.page.title || 'Sin título'}</span>
                {h.snippet && <br />}
                {h.snippet && <span className="pi-snippet" dangerouslySetInnerHTML={{ __html: highlight(h.snippet) }} />}
              </span>
            </button>
          ))}
        </div>
        <div className="palette__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
