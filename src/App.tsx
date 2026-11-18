import { useEffect, useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './state/WorkspaceContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { DatabaseView } from './components/DatabaseView';
import { SearchPalette } from './components/SearchPalette';
import { TrashView } from './components/TrashView';
import { Icon } from './lib/icons';

function MainArea() {
  const { loaded, byId, activePageId, showTrash, saveError, createPage, undo, redo, canUndo, canRedo } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // atajos globales: Ctrl/Cmd+Z deshacer, Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y rehacer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  if (!loaded) {
    return (
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-55)', fontFamily: 'var(--font-display)', fontSize: 20 }}>Abriendo tu cuaderno…</p>
      </div>
    );
  }

  const active = activePageId ? byId.get(activePageId) : undefined;
  const visibleActive = active && !active.trashed ? active : undefined;

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Mostrar/ocultar barra lateral">
          <Icon name="notebook" size={17} />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>MEGAnote</span>
        <span className="topbar__hist">
          <button
            className="iconbtn"
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            aria-label="Deshacer"
          >
            <Icon name="undo" size={16} />
          </button>
          <button
            className="iconbtn"
            onClick={redo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            aria-label="Rehacer"
          >
            <Icon name="redo" size={16} />
          </button>
        </span>
      </div>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main" id="main">
        {showTrash ? (
          <TrashView />
        ) : visibleActive ? (
          visibleActive.kind === 'database' ? (
            <DatabaseView key={visibleActive.id} page={visibleActive} />
          ) : (
            <Editor key={visibleActive.id} page={visibleActive} />
          )
        ) : (
          <div className="emptystate">
            <div className="es-art"><Icon name="logo" size={64} strokeWidth={1.3} /></div>
            <h2>Una página en blanco es una virtud</h2>
            <p>Nada seleccionado, nada perdido. Elige una página del árbol, o empieza una nueva — se queda en esta máquina, siempre.</p>
            <button className="btn btn--primary" style={{ margin: '0 auto' }} onClick={() => createPage(null, 'page')}>
              <Icon name="plus" size={14} strokeWidth={2} /> Nueva página
            </button>
          </div>
        )}
        {saveError && (
          <div className="savetoast savetoast--err" role="alert">
            <Icon name="warning" size={13} /> {saveError}
          </div>
        )}
      </main>
      <SearchPalette />
    </>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <div className="app">
        <MainArea />
      </div>
    </WorkspaceProvider>
  );
}
