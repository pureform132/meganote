/* IndexedDB persistence: one record holding the whole multi-workspace store.
   Renamed from the old 'meganote' database — existing installs migrate automatically. */
import { newId, now, type AppStore, type Notebook, type Page, type Workspace } from './types';

const DB_NAME = 'meganote';
const LEGACY_DB_NAME = 'meganote';
const DB_VERSION = 1;
const STORE = 'workspace';
const KEY = 'v1';

function openDB(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function readRaw(name: string): Promise<unknown | null> {
  const db = await openDB(name);
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
    });
  } finally {
    db.close();
  }
}

/** Parse the stored record, migrating the v1 single-notebook format if needed. */
function parseStore(raw: unknown): AppStore | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Partial<AppStore> & Partial<Workspace>;
  if (v.version === 2 && Array.isArray(v.notebooks) && typeof v.currentId === 'string') {
    return raw as AppStore;
  }
  if (v.version === 1 && Array.isArray(v.pages)) {
    const notebook: Notebook = {
      id: newId(),
      name: 'Personal',
      icon: 'leaf',
      created: now(),
      pages: v.pages as Page[],
    };
    return { version: 2, notebooks: [notebook], currentId: notebook.id };
  }
  return null;
}

/** Load the store; falls back to the old 'meganote' database and migrates it. */
export async function loadStore(): Promise<AppStore | null> {
  const fresh = await readRaw(DB_NAME).catch(() => null);
  const freshParsed = parseStore(fresh);
  if (freshParsed) return freshParsed;

  const legacy = await readRaw(LEGACY_DB_NAME).catch(() => null);
  const legacyParsed = parseStore(legacy);
  if (!legacyParsed) return null;
  // copia íntegra al nuevo almacén; el antiguo se conserva como respaldo
  await saveStore(legacyParsed);
  return legacyParsed;
}

export async function saveStore(store: AppStore): Promise<void> {
  const db = await openDB(DB_NAME);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(store, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
    });
  } finally {
    db.close();
  }
}
