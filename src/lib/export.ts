/* Export / import helpers — the workspace as plain, portable JSON and Markdown. */
import type { AppStore, Block, Page } from './types';
import { htmlToText } from './html';

export function downloadFile(filename: string, content: string, mime = 'application/octet-stream') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function blockToMd(b: Block, pages?: Page[], allBlocks?: Block[]): string {
  const inline = (html: string) =>
    html
      .replace(/<b>|<\/b>|<strong>|<\/strong>/gi, '**')
      .replace(/<i>|<\/i>|<em>|<\/em>/gi, '*')
      .replace(/<s>|<\/s>|<strike>|<\/strike>|<del>|<\/del>/gi, '~~')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<code>|<\/code>/gi, '`');
  const text = inline(b.html || b.text).trim();
  const indent = '  '.repeat(Math.min(4, b.level));
  switch (b.type) {
    case 'h1': return `# ${text}`;
    case 'h2': return `## ${text}`;
    case 'h3': return `### ${text}`;
    case 'bulleted': return `${indent}- ${text}`;
    case 'numbered': return `${indent}1. ${text}`;
    case 'todo': return `${indent}- [${b.checked ? 'x' : ' '}] ${text}`;
    case 'toggle': return `${indent}- ${text}`;
    case 'quote': return `> ${text}`;
    case 'code': return `\`\`\`${b.lang ?? ''}\n${htmlToText(b.html || b.text)}\n\`\`\``;
    case 'callout': return `> [!note]\n> ${text}`;
    case 'divider': return `---`;
    case 'image': return b.src ? `![${b.alt ?? ''}](${b.src.startsWith('data:') ? '(imagen incrustada — ver copia JSON)' : b.src})` : '';
    case 'file': return b.fileName ? `[archivo: ${b.fileName}]` : '';
    case 'subpage': {
      const target = pages?.find((p) => p.id === b.pageId);
      return `- ${target?.title || 'Subpágina'}`;
    }
    case 'pageLink': {
      const target = pages?.find((p) => p.id === b.pageId);
      return `[${target?.title || 'Página'}]`;
    }
    case 'toc': {
      const heads = (allBlocks ?? []).filter((x) => x.type === 'h1' || x.type === 'h2' || x.type === 'h3');
      return heads.map((h) => `${'  '.repeat(h.type === 'h2' ? 1 : h.type === 'h3' ? 2 : 0)}- ${inline(h.html || h.text).trim()}`).join('\n');
    }
    default: return text;
  }
}

export function pageToMarkdown(p: Page, allPages?: Page[]): string {
  if (p.kind === 'database' && p.db) {
    const cols = p.db.columns;
    const head = `| ${cols.map((c) => c.name).join(' | ')} |`;
    const sep = `| ${cols.map(() => '---').join(' | ')} |`;
    const rows = p.db.rows.map(
      (r) =>
        `| ${cols
          .map((c) => {
            const v = r.cells[c.id];
            if (v === null || v === undefined) return '';
            if (c.type === 'select') return c.options?.find((o) => o.id === v)?.label ?? String(v);
            if (c.type === 'checkbox') return v ? 'yes' : 'no';
            return String(v).replace(/\|/g, '\\|');
          })
          .join(' | ')} |`,
    );
    return [`# ${p.title || 'Untitled'}`, '', head, sep, ...rows].join('\n') + '\n';
  }
  return [`# ${p.title || 'Untitled'}`, '']
    .concat(p.blocks.map((b) => blockToMd(b, allPages, p.blocks)).filter(Boolean))
    .join('\n') + '\n';
}

export function workspaceToJSON(ws: AppStore): string {
  return JSON.stringify(ws, null, 2);
}
