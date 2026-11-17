/* Estado del cuaderno: fuente única de verdad, con persistencia en IndexedDB (debounce). */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import {
  emptyBlock, emptyPage, newId, now,
  type AppStore, type Block, type BlockType, type DBState, type Notebook, type Page, type PageKind,
} from '../lib/types';
import { loadStore, saveStore } from '../lib/db';
import { seedStore } from '../lib/seed';
import { htmlToText } from '../lib/html';
import { workspaceToJSON, downloadFile, timestamp, pageToMarkdown } from '../lib/export';

export interface WorkspaceContextValue {
  loaded: boolean;
  saveError: string | null;
  saveState: 'idle' | 'saving' | 'saved';
  savedAt: number | null;
  pages: Page[];
  byId: Map<string, Page>;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  showTrash: boolean;
  setShowTrash: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean | ((v: boolean) => boolean)) => void;

  // notebooks (workspaces)
  notebooks: { id: string; name: string; icon: string }[];
  currentNotebookId: string;
  currentNotebookName: string;
  setCurrentNotebook: (id: string) => void;
  createNotebook: (name: string) => string;
  renameNotebook: (id: string, name: string) => void;

  createPage: (parentId: string | null, kind?: PageKind) => string;
  duplicatePage: (id: string) => string;
  movePage: (id: string, parentId: string | null) => boolean;
  updatePage: (id: string, patch: Partial<Omit<Page, 'id' | 'created'>>) => void;
  toggleFavorite: (id: string) => void;
  trashPage: (id: string) => void;
  restorePage: (id: string) => void;
  deletePageForever: (id: string) => void;
  emptyTrash: () => void;
  trashCount: number;
  trashedPages: Page[];

  addBlock: (pageId: string, block: Block, index?: number) => void;
  updateBlock: (pageId: string, blockId: string, patch: Partial<Block>) => void;
  removeBlock: (pageId: string, blockId: string) => void;
  splitBlock: (pageId: string, blockId: string, beforeHtml: string, beforeText: string, afterHtml: string, afterText: string) => string;
  mergeIntoPrevious: (pageId: string, blockId: string) => void;
  focusRequest: { id: string; nonce: number } | null;
  requestFocus: (id: string) => void;

  updateDB: (pageId: string, updater: (db: DBState) => DBState) => void;
  importPages: (pages: Page[]) => number;

  exportBackup: () => void;
  exportPageMarkdown: (pageId: string) => void;
  importBackup: (file: File) => Promise<{ ok: boolean; error?: string; count?: number }>;
}

const Ctx = createContext<WorkspaceContextValue | null>(null);

function subtreeIds(pages: Page[], rootId: string): Set<string> {
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [store, setStore] = useState<AppStore | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null);
  const saveTimer = useRef<number | null>(null);
  const storeRef = useRef<AppStore | null>(null);
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);
  useEffect(() => {
    activeRef.current = activePageId;
  }, [activePageId]);

  // carga inicial (con migración de v1)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadStore();
        const initial = stored ?? seedStore();
        if (cancelled) return;
        setStore(initial);
        const first = initial.notebooks.find((n) => n.id === initial.currentId)?.pages[0] ?? initial.notebooks[0]?.pages[0];
        setActivePageId(first?.id ?? null);
        if (!stored) await saveStore(initial);
      } catch (e) {
        if (!cancelled) {
          setStore(seedStore());
          setSaveError('No se pudo abrir el almacén local — los cambios pueden no guardarse. ' + (e instanceof Error ? e.message : ''));
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // persistencia con debounce
  useEffect(() => {
    if (!loaded || !store) return;
    setSaveState('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveStore(store)
        .then(() => {
          setSaveError(null);
          setSaveState('saved');
          setSavedAt(Date.now());
        })
        .catch((e) => {
          setSaveError(e instanceof Error ? e.message : 'No se pudo guardar');
          setSaveState('idle');
        });
    }, 350);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [store, loaded]);

  const notebooksMeta = useMemo(
    () => (store?.notebooks ?? []).map((n) => ({ id: n.id, name: n.name, icon: n.icon })),
    [store],
  );
  const currentNotebook = useMemo(
    () => store?.notebooks.find((n) => n.id === store.currentId) ?? store?.notebooks[0] ?? null,
    [store],
  );
  const pages = useMemo(() => currentNotebook?.pages ?? [], [currentNotebook]);
  const byId = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);
  const visiblePages = useMemo(() => pages.filter((p) => !p.trashed), [pages]);
  const trashedPages = useMemo(() => pages.filter((p) => p.trashed), [pages]);
  const trashCount = trashedPages.length;

  const updateCurrent = useCallback((fn: (pages: Page[]) => Page[]) => {
    setStore((prev) => {
      if (!prev) return prev;
      const current = prev.notebooks.find((n) => n.id === prev.currentId) ?? prev.notebooks[0];
      if (!current) return prev;
      const nextPages = fn(current.pages);
      const nextNotebooks = prev.notebooks.map((n) => (n.id === current.id ? { ...n, pages: nextPages } : n));
      return { ...prev, notebooks: nextNotebooks };
    });
  }, []);

  const touch = (patch: Partial<Page>) => ({ ...patch, updated: now() });

  const setCurrentNotebook = useCallback((id: string) => {
    setStore((prev) => {
      if (!prev) return prev;
      const target = prev.notebooks.find((n) => n.id === id);
      if (!target) return prev;
      return { ...prev, currentId: id };
    });
    setActivePageId(null);
    setShowTrash(false);
  }, []);

  const createNotebook = useCallback((name: string) => {
    const id = newId();
    setStore((prev) => {
      const fresh: Notebook = {
        id,
        name: name.trim() || 'Nuevo workspace',
        icon: 'folder',
        created: now(),
        pages: [emptyPage(null, 'page')],
      };
      return prev
        ? { ...prev, notebooks: [...prev.notebooks, fresh], currentId: id }
        : prev;
    });
    setActivePageId(null);
    setShowTrash(false);
    return id;
  }, []);

  const renameNotebook = useCallback((id: string, name: string) => {
    setStore((prev) =>
      prev
        ? { ...prev, notebooks: prev.notebooks.map((n) => (n.id === id ? { ...n, name: name.trim() || n.name } : n)) }
        : prev,
    );
  }, []);

  const createPage = useCallback(
    (parentId: string | null, kind: PageKind = 'page') => {
      const p = emptyPage(parentId, kind);
      updateCurrent((prev) => [...prev, p]);
      setActivePageId(p.id);
      setShowTrash(false);
      return p.id;
    },
    [updateCurrent],
  );

  const duplicatePage = useCallback(
    (id: string) => {
      const source = pages.find((p) => p.id === id);
      if (!source) return '';
      const ids = subtreeIds(pages, id);
      const ordered = pages.filter((p) => ids.has(p.id));
      const idMap = new Map(ordered.map((p) => [p.id, newId()]));
      const t = now();
      const copies: Page[] = ordered.map((p, index) => ({
        ...p,
        id: idMap.get(p.id)!,
        parentId: p.parentId && idMap.has(p.parentId) ? idMap.get(p.parentId)! : p.parentId,
        title: index === 0 ? (p.title ? `${p.title} (copia)` : 'Copia sin título') : p.title,
        favorite: false,
        trashed: false,
        created: t,
        updated: t,
        blocks: p.blocks.map((b) => ({
          ...b,
          id: newId(),
          pageId: b.pageId && idMap.has(b.pageId) ? idMap.get(b.pageId)! : b.pageId,
        })),
        db: p.db ? (JSON.parse(JSON.stringify(p.db)) as DBState) : undefined,
      }));
      const root = copies[0];
      if (!root) return '';
      updateCurrent((prev) => [...prev, ...copies]);
      setActivePageId(root.id);
      setShowTrash(false);
      return root.id;
    },
    [pages, updateCurrent],
  );

  const movePage = useCallback(
    (id: string, parentId: string | null) => {
      if (id === parentId) return false;
      const ids = subtreeIds(pages, id);
      if (parentId && ids.has(parentId)) return false;
      updateCurrent((prev) =>
        prev.map((p) => (p.id === id ? { ...p, parentId, updated: now() } : p)),
      );
      return true;
    },
    [pages, updateCurrent],
  );

  const updatePage = useCallback(
    (id: string, patch: Partial<Omit<Page, 'id' | 'created'>>) => {
      updateCurrent((prev) => prev.map((p) => (p.id === id ? { ...p, ...touch(patch) } : p)));
    },
    [updateCurrent],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      updateCurrent((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));
    },
    [updateCurrent],
  );

  const trashPage = useCallback(
    (id: string) => {
      const ids = subtreeIds(pages, id);
      updateCurrent((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, trashed: true } : p)));
      const act = activeRef.current;
      if (act && ids.has(act)) {
        setShowTrash(true);
        setActivePageId(null);
      }
    },
    [pages, updateCurrent],
  );

  const restorePage = useCallback(
    (id: string) => {
      const ids = subtreeIds(pages, id);
      updateCurrent((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, trashed: false } : p)));
    },
    [pages, updateCurrent],
  );

  const deletePageForever = useCallback(
    (id: string) => {
      const ids = subtreeIds(pages, id);
      updateCurrent((prev) => prev.filter((p) => !ids.has(p.id)));
      setActivePageId((cur) => (cur && ids.has(cur) ? null : cur));
    },
    [pages, updateCurrent],
  );

  const emptyTrash = useCallback(() => {
    updateCurrent((prev) => prev.filter((p) => !p.trashed));
    setActivePageId(null);
    setShowTrash(false);
  }, [updateCurrent]);

  const addBlock = useCallback(
    (pageId: string, block: Block, index?: number) => {
      updateCurrent((prev) =>
        prev.map((p) => {
          if (p.id !== pageId) return p;
          const blocks = [...p.blocks];
          const at = index === undefined ? blocks.length : Math.max(0, Math.min(index, blocks.length));
          blocks.splice(at, 0, block);
          return { ...p, blocks, updated: now() };
        }),
      );
    },
    [updateCurrent],
  );

  const updateBlock = useCallback(
    (pageId: string, blockId: string, patch: Partial<Block>) => {
      updateCurrent((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? {
                ...p,
                updated: now(),
                blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...patch, text: patch.text ?? (patch.html !== undefined ? htmlToText(patch.html) : b.text) } : b)),
              }
            : p,
        ),
      );
    },
    [updateCurrent],
  );

  const removeBlock = useCallback(
    (pageId: string, blockId: string) => {
      updateCurrent((prev) =>
        prev.map((p) => {
          if (p.id !== pageId) return p;
          const blocks = p.blocks.filter((b) => b.id !== blockId);
          return { ...p, blocks: blocks.length ? blocks : [emptyBlock('text')], updated: now() };
        }),
      );
    },
    [updateCurrent],
  );

  const splitBlock = useCallback(
    (pageId: string, blockId: string, beforeHtml: string, beforeText: string, afterHtml: string, afterText: string) => {
      const newId2 = newId();
      updateCurrent((prev) =>
        prev.map((p) => {
          if (p.id !== pageId) return p;
          const i = p.blocks.findIndex((b) => b.id === blockId);
          if (i < 0) return p;
          const src = p.blocks[i];
          const childType: BlockType =
            src.type === 'bulleted' || src.type === 'numbered' || src.type === 'todo' || src.type === 'toggle' ? src.type : 'text';
          const before: Block = { ...src, html: beforeHtml, text: beforeText };
          const after: Block = {
            id: newId2,
            type: childType,
            html: afterHtml,
            text: afterText,
            level: src.level,
            checked: childType === 'todo' ? false : undefined,
            open: childType === 'toggle' ? true : undefined,
          };
          const blocks = [...p.blocks];
          blocks.splice(i, 1, before, after);
          return { ...p, blocks, updated: now() };
        }),
      );
      return newId2;
    },
    [updateCurrent],
  );

  const mergeIntoPrevious = useCallback(
    (pageId: string, blockId: string) => {
      updateCurrent((prev) =>
        prev.map((p) => {
          if (p.id !== pageId) return p;
          const i = p.blocks.findIndex((b) => b.id === blockId);
          if (i <= 0) return p;
          const prevBlock = p.blocks[i - 1];
          const cur = p.blocks[i];
          if (prevBlock.type === 'divider' || prevBlock.type === 'image') return p;
          const merged: Block = {
            ...prevBlock,
            html: prevBlock.html + cur.html,
            text: (prevBlock.text + ' ' + cur.text).trim(),
          };
          const blocks = [...p.blocks];
          blocks.splice(i - 1, 2, merged);
          return { ...p, blocks, updated: now() };
        }),
      );
    },
    [updateCurrent],
  );

  const requestFocus = useCallback((id: string) => {
    setFocusRequest({ id, nonce: Date.now() });
  }, []);

  const updateDB = useCallback(
    (pageId: string, updater: (db: DBState) => DBState) => {
      updateCurrent((prev) =>
        prev.map((p) => (p.id === pageId && p.db ? { ...p, db: updater(p.db), updated: now() } : p)),
      );
    },
    [updateCurrent],
  );

  const importPages = useCallback(
    (incoming: Page[]) => {
      if (incoming.length === 0) return 0;
      updateCurrent((prev) => [...prev, ...incoming]);
      return incoming.length;
    },
    [updateCurrent],
  );

  const exportBackup = useCallback(() => {
    const s = storeRef.current;
    if (!s) return;
    downloadFile(`takenotes-backup-${timestamp()}.json`, workspaceToJSON(s), 'application/json');
  }, []);

  const exportPageMarkdown = useCallback((pageId: string) => {
    const s = storeRef.current;
    const current = s?.notebooks.find((n) => n.id === s.currentId) ?? s?.notebooks[0];
    const p = current?.pages.find((x) => x.id === pageId);
    if (!p) return;
    const safe =
      (p.title || 'sin-titulo')
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñü]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'pagina';
    downloadFile(`takenotes-${safe}-${timestamp()}.md`, pageToMarkdown(p, current?.pages), 'text/markdown');
  }, []);

  const importBackup = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      if (!data || typeof data !== 'object') return { ok: false, error: 'Archivo de backup no válido.' };
      const d = data as Record<string, unknown>;

      // v2: store completo con notebooks
      if (d.version === 2 && Array.isArray(d.notebooks)) {
        const notebooks = (d.notebooks as unknown[]).filter(
          (n): n is Notebook =>
            !!n && typeof n === 'object' && typeof (n as Notebook).id === 'string' &&
            typeof (n as Notebook).name === 'string' && Array.isArray((n as Notebook).pages),
        );
        if (notebooks.length === 0) return { ok: false, error: 'El backup no contiene ningún notebook válido.' };
        const normalized: Notebook[] = notebooks.map((n) => ({
          ...n,
          pages: n.pages.map(normalizePage),
        }));
        const store: AppStore = {
          version: 2,
          notebooks: normalized,
          currentId: typeof d.currentId === 'string' && normalized.some((n) => n.id === d.currentId) ? (d.currentId as string) : normalized[0].id,
        };
        setStore(store);
        setActivePageId(store.notebooks.find((n) => n.id === store.currentId)?.pages[0]?.id ?? null);
        setShowTrash(false);
        await saveStore(store);
        return { ok: true, count: store.notebooks.reduce((a, n) => a + n.pages.length, 0) };
      }

      // v1: el formato antiguo de un solo cuaderno → se migra y se reemplaza
      if (d.version === 1 && Array.isArray(d.pages)) {
        const valid = (d.pages as unknown[]).filter(
          (p): p is Page =>
            !!p && typeof p === 'object' &&
            typeof (p as Page).id === 'string' &&
            typeof (p as Page).title === 'string' &&
            Array.isArray((p as Page).blocks),
        );
        if (valid.length === 0) return { ok: false, error: 'El backup no contiene páginas válidas.' };
        const notebook: Notebook = {
          id: newId(),
          name: 'Personal',
          icon: 'leaf',
          created: now(),
          pages: valid.map(normalizePage),
        };
        const store: AppStore = { version: 2, notebooks: [notebook], currentId: notebook.id };
        setStore(store);
        setActivePageId(notebook.pages[0]?.id ?? null);
        setShowTrash(false);
        await saveStore(store);
        return { ok: true, count: notebook.pages.length };
      }

      return { ok: false, error: 'Formato no reconocido — se esperaba un backup Takenotes (v1 o v2).' };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'No se pudo leer el archivo de backup.' };
    }
  }, []);

  const value: WorkspaceContextValue = {
    loaded,
    saveError,
    saveState,
    savedAt,
    pages: visiblePages,
    byId,
    activePageId,
    setActivePageId,
    showTrash,
    setShowTrash,
    searchOpen,
    setSearchOpen,
    notebooks: notebooksMeta,
    currentNotebookId: currentNotebook?.id ?? '',
    currentNotebookName: currentNotebook?.name ?? 'Workspace',
    setCurrentNotebook,
    createNotebook,
    renameNotebook,
    createPage,
    duplicatePage,
    movePage,
    updatePage,
    toggleFavorite,
    trashPage,
    restorePage,
    deletePageForever,
    emptyTrash,
    trashCount,
    trashedPages,
    addBlock,
    updateBlock,
    removeBlock,
    splitBlock,
    mergeIntoPrevious,
    focusRequest,
    requestFocus,
    updateDB,
    importPages,
    exportBackup,
    exportPageMarkdown,
    importBackup,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function normalizePage(p: Page): Page {
  return {
    ...p,
    favorite: !!p.favorite,
    trashed: !!p.trashed,
    blocks: p.blocks ?? [],
    parentId: typeof p.parentId === 'string' ? p.parentId : null,
  };
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWorkspace debe usarse dentro de WorkspaceProvider');
  return ctx;
}
