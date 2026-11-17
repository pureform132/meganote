/* Minimal HTML sanitizer: keeps only simple inline formatting from editor output. */

const ALLOWED: Record<string, string> = {
  B: 'b', STRONG: 'b', I: 'i', EM: 'i', S: 's', STRIKE: 's', DEL: 's', U: 'u', CODE: 'code', BR: 'br',
};

export function sanitizeInline(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  const out = document.createElement('div');
  const walk = (src: Node, dst: Node) => {
    for (const child of Array.from(src.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        dst.appendChild(document.createTextNode(child.textContent ?? ''));
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = ALLOWED[(child as Element).tagName];
      if (tag) {
        const el = document.createElement(tag);
        walk(child, el);
        dst.appendChild(el);
      } else {
        walk(child, dst); // unwrap disallowed tags, keep their text
      }
    }
  };
  walk(root, out);
  return out.innerHTML;
}

/** Plain text from (possibly formatted) HTML — used for search and text extraction. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\u00A0/g, ' ').trim();
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
