/** Drag-and-drop contract for pages (sidebar tree, subpage cards and page links). */
export const PAGE_DRAG_MIME = 'application/x-takenotes-page';

export function setPageDrag(e: React.DragEvent, pageId: string): void {
  e.dataTransfer.setData(PAGE_DRAG_MIME, pageId);
  e.dataTransfer.setData('text/plain', pageId);
  e.dataTransfer.effectAllowed = 'copyMove';
}

export function getPageDrag(e: React.DragEvent): string | null {
  const id = e.dataTransfer.getData(PAGE_DRAG_MIME) || e.dataTransfer.getData('text/plain');
  return id && id.length < 80 ? id : null;
}

export function hasPageDrag(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(PAGE_DRAG_MIME);
}
