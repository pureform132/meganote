/* IndexedDB persistence: one record holding the whole multi-workspace store. */
import { newId, now, type AppStore, type Notebook, type Page, type Workspace } from './types';

const DB_NAME = 'takenotes';
const DB_VERSION = 1;
const STORE = 'workspace';
const KEY = 'v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

/** Load the store, migrating the v1 single-notebook format if needed. */
export async function loadStore(): Promise<AppStore | null> {
  const db = await openDB();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
    });
    if (!raw || typeof raw !== 'object') return null;
    const v = raw as Partial<AppStore> & Partial<Workspace>;
    if (v.version === 2 && Array.isArray(v.notebooks) && typeof v.currentId === 'string') {
      return raw as AppStore;
    }
    // v1 → v2 migration: wrap the single page set in "Personal"
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
  } finally {
    db.close();
  }
}

export async function saveStore(store: AppStore): Promise<void> {
  const db = await openDB();
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
