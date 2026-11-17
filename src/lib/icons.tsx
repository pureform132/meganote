/* Authored icon set for Takenotes — single stroke weight, round caps/joins. No unicode glyphs. */
import type { JSX } from 'react';

export type IconName =
  | 'logo' | 'doc' | 'sun' | 'compass' | 'keyboard' | 'leaf' | 'briefcase' | 'book' | 'folder'
  | 'search' | 'plus' | 'check' | 'x' | 'chevronRight' | 'chevronDown' | 'chevronUp'
  | 'star' | 'trash' | 'restore' | 'table' | 'board' | 'calendar' | 'filter' | 'sort'
  | 'text' | 'heading' | 'bulletList' | 'numberedList' | 'checkSquare' | 'toggle' | 'quote'
  | 'code' | 'callout' | 'divider' | 'image' | 'database' | 'info' | 'arrowRight'
  | 'pen' | 'clock' | 'dot' | 'export' | 'warning' | 'notebook'
  | 'import' | 'chart' | 'file' | 'download' | 'moon';

const paths: Record<IconName, JSX.Element> = {
  logo: (
    <>
      <path d="M7 19c2.2-.4 3-6.9 4.1-10.3.8-2.9 2.1-2.4 3 .3.5 1.6 1 3.7 1.3 5.3" />
      <path d="M17.3 8h2.4M17.3 12h2.4M17.3 16h2.4" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3.5h7L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M13.5 3.5V8H18.5" />
      <path d="M9 12.5h6M9 16h4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.4 4.6-4.6 2.4 2.4-4.6z" strokeLinejoin="round" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="2" />
      <path d="M6 10.7h.01M10 10.7h.01M14 10.7h.01M18 10.7h.01M6.5 14h11" />
    </>
  ),
  leaf: (
    <>
      <path d="M6 18C6 9 10 5.5 19 5c-.5 9-4.5 13-13 13Z" />
      <path d="M6 18c3-5.5 7-9 10.5-10.5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M3 13h18" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5Z" />
      <path d="M5 5.5v15M19 18v3.5H7.5" />
    </>
  ),
  folder: (
    <path d="M3.5 7A2 2 0 0 1 5.5 5h4l2 2.5h7A2 2 0 0 1 20.5 9.5v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronUp: <path d="m6 14.5 6-6 6 6" />,
  star: (
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L4.5 9.7l5.9-.8Z" strokeLinejoin="round" />
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l1.2 13a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9L17.5 7" />
      <path d="M10.2 11.5v5M13.8 11.5v5" />
    </>
  ),
  restore: (
    <>
      <path d="M4 9a8 8 0 1 1-1 5.2" />
      <path d="M4 4.5V9h4.5" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M10 4.5v15" />
    </>
  ),
  board: (
    <>
      <rect x="3.5" y="4.5" width="5.5" height="15" rx="1.2" />
      <rect x="9.75" y="4.5" width="5.5" height="10" rx="1.2" />
      <rect x="16" y="4.5" width="5" height="6.5" rx="1.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 9.5h17" />
    </>
  ),
  filter: <path d="M4 7h16M7 12h10M10 17h4" />,
  sort: <path d="M7 5v14M7 19l-3-3M7 19l3-3M13 7h7M13 12h5M13 17h3" />,
  text: <path d="M5 6.5h14M5 12h14M5 17.5h9" />,
  heading: (
    <>
      <path d="M6 5v14M12 5v14M6 12h6" />
      <path d="M17 9.5h3.2c0-1.2-.7-2-1.9-2-1 0-1.6.6-1.6 1.6 0 2.8 3.5 1.8 3.5 4.4h-3.5" />
    </>
  ),
  bulletList: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  numberedList: (
    <>
      <path d="M10.5 6.5H20M10.5 12H20M10.5 17.5H20" />
      <path d="M4 5.2 5.2 4.5v4M4 11.6c.1-1 .8-1.5 1.6-1.5.9 0 1.5.6 1.4 1.4-.1 1.4-3 2-3 3.2h3.1M4.2 16.5h2.3a1 1 0 0 1 0 2H4.5" strokeWidth="1.3" />
    </>
  ),
  checkSquare: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="m8.8 12.2 2.6 2.6 4-5" />
    </>
  ),
  toggle: (
    <>
      <path d="m9 6.5 5 5-5 5" strokeLinejoin="round" />
      <path d="M16 8.5h4M16 12h4M16 15.5h4" opacity="0.55" />
    </>
  ),
  quote: (
    <>
      <path d="M9.5 6.5H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6c0-1.2.6-2 1.9-2" />
      <path d="M20 6.5h-3.5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6c0-1.2.6-2 1.9-2" opacity="0.75" />
    </>
  ),
  code: (
    <>
      <path d="m8.5 8-5 4 5 4M15.5 8l5 4-5 4" strokeLinejoin="round" />
      <path d="M12.8 5.5l-1.6 13" opacity="0.7" />
    </>
  ),
  callout: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7.5 9.5h6M7.5 13h9" />
      <circle cx="16.8" cy="9.3" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  divider: <path d="M4 12h16M8 8.5h8" opacity="0.8" />,
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10.5" r="1.4" />
      <path d="m5.5 17.5 5.2-5a1.6 1.6 0 0 1 2.1 0l6.7 6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.3" rx="7.2" ry="2.6" />
      <path d="M4.8 6.3v11.5c0 1.4 3.2 2.6 7.2 2.6s7.2-1.2 7.2-2.6V6.3M4.8 12c0 1.4 3.2 2.6 7.2 2.6s7.2-1.2 7.2-2.6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  pen: (
    <>
      <path d="M4 20l.9-4.2L14.6 6a1.8 1.8 0 0 1 2.5 2.5L7.3 18.2Z" strokeLinejoin="round" />
      <path d="M12.5 8l3.4 3.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />,
  export: (
    <>
      <path d="M12 3.5v11M8 7.5l4-4 4 4" />
      <path d="M5 14.5v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4Z" strokeLinejoin="round" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  import: (
    <>
      <path d="M12 3.5v11M8.5 11 12 14.5 15.5 11" />
      <path d="M5 15v3a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 18v-3" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11M8.5 11 12 14.5 15.5 11" />
      <path d="M5 15.5v3A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-3" />
    </>
  ),
  chart: (
    <>
      <path d="M4.5 4.5v15h15" />
      <path d="M8 15.5v-4M12 15.5V8M16 15.5v-6.5" strokeWidth="2" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M13.5 3.5V8H18.5" />
      <path d="M9.5 12h5M9.5 15.5h3.5" />
    </>
  ),
  moon: (
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
  ),
  notebook: (
    <>
      <rect x="5" y="3" width="14.5" height="18" rx="2" />
      <path d="M9 3v18M8 3v3.5M13.5 8h3M13.5 12h3M13.5 16h3" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.6,
  filled = false,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
