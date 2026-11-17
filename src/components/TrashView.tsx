import { useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { Icon, type IconName } from '../lib/icons';

export function TrashView() {
  const { trashedPages, restorePage, deletePageForever, emptyTrash } = useWorkspace();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  return (
    <div className="trashview">
      <h1>Papelera</h1>
      <p className="sub">
        {trashedPages.length === 0
          ? 'Las páginas que borres aterrizan aquí primero. Nada se pierde hasta que tú lo digas.'
          : `${trashedPages.length} ${trashedPages.length === 1 ? 'página esperando' : 'páginas esperando'} una segunda oportunidad.`}
      </p>

      {trashedPages.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          {confirmEmpty ? (
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-55)' }}>¿Borrar todo para siempre?</span>
              <button className="btn-danger" onClick={() => { emptyTrash(); setConfirmEmpty(false); }}>Sí, vaciar</button>
              <button className="btn-ghost" onClick={() => setConfirmEmpty(false)}>Conservar</button>
            </span>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmEmpty(true)}>Vaciar papelera…</button>
          )}
        </div>
      )}

      {trashedPages.length === 0 && (
        <div className="emptiedbox">
          <div className="big"><Icon name="notebook" size={54} strokeWidth={1.1} /></div>
          <p>Vacía. Las páginas borradas y sus subpáginas aparecerán aquí.</p>
        </div>
      )}

      {trashedPages.map((p) => (
        <div key={p.id} className="trashrow">
          <Icon name={(p.icon || 'doc') as IconName} size={17} />
          <div className="tmeta">
            <div className="ttitle">{p.title || 'Sin título'}</div>
            <div className="tsub">
              {p.kind === 'database' ? 'Base de datos' : 'Página'} · editada{' '}
              {new Date(p.updated).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <button className="btn-ghost" onClick={() => restorePage(p.id)} title="Devolver la página y sus subpáginas">
            <Icon name="restore" size={13} /> Restaurar
          </button>
          <button className="btn-danger" onClick={() => deletePageForever(p.id)} title="Borrar esta página para siempre">
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
