/* Authored icon set for MEGAnote — single stroke weight, round caps/joins. No unicode glyphs. */
import type { JSX } from 'react';

export type IconName =
  | 'logo' | 'doc' | 'sun' | 'compass' | 'keyboard' | 'leaf' | 'briefcase' | 'book' | 'folder'
  | 'search' | 'plus' | 'check' | 'x' | 'chevronRight' | 'chevronDown' | 'chevronUp'
  | 'star' | 'trash' | 'restore' | 'table' | 'board' | 'calendar' | 'filter' | 'sort'
  | 'text' | 'heading' | 'bulletList' | 'numberedList' | 'checkSquare' | 'toggle' | 'quote'
  | 'code' | 'callout' | 'divider' | 'image' | 'database' | 'info' | 'arrowRight'
  | 'pen' | 'clock' | 'dot' | 'export' | 'warning' | 'notebook'
  | 'import' | 'chart' | 'file' | 'download' | 'moon'
  | 'undo' | 'redo' | 'hash' | 'tags' | 'link' | 'mail' | 'phone' | 'duplicate'
  | 'heart' | 'globe' | 'cloud' | 'flame' | 'zap' | 'music' | 'video' | 'camera'
  | 'coffee' | 'gift' | 'bell' | 'lock' | 'key' | 'home' | 'building' | 'flag'
  | 'mapPin' | 'plane' | 'car' | 'tree' | 'flower' | 'lightbulb' | 'rocket' | 'crown'
  | 'gem' | 'apple' | 'bookmark' | 'inbox' | 'archive' | 'tag' | 'wallet' | 'target'
  | 'trophy' | 'puzzle' | 'palette' | 'wrench' | 'pin' | 'megaphone' | 'umbrella'
  | 'gamepad' | 'clapper';

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
  undo: (
    <>
      <path d="M8.5 5.5 4 10l4.5 4.5" />
      <path d="M4 10h10.2a5.4 5.4 0 0 1 0 10.8H11" />
    </>
  ),
  redo: (
    <>
      <path d="M15.5 5.5 20 10l-4.5 4.5" />
      <path d="M20 10H9.8a5.4 5.4 0 0 0 0 10.8H13" />
    </>
  ),
  hash: <path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h15.5M3.5 15h15.5" />,
  heart: <path d="M12 20s-6.5-4.3-9-9a5.2 5.2 0 0 1 9-4.6A5.2 5.2 0 0 1 21 11c-2.5 4.7-9 9-9 9Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-3.2 2.9-5 5.5-5 8.5s1.8 5.6 5 8.5M12 3.5c3.2 2.9 5 5.5 5 8.5s-1.8 5.6-5 8.5" />
    </>
  ),
  cloud: <path d="M7.5 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.7 9.6 4.2 4.2 0 0 1 17.2 18Z" />,
  flame: <path d="M12 3s5 4.6 5 9.6A5 5 0 0 1 12 17.6 5 5 0 0 1 7 12.6c0-1.6.6-2.8 1.6-4.4.7 1.5 1.5 2.3 2.9 3-.6-2-.6-4.6.5-8.2Z" />,
  zap: <path d="M13 2 5 13.5h5.5L9.5 22 18 10.5h-5.5Z" />,
  music: (
    <>
      <path d="M9 18.5V6l10-2.5V16" />
      <circle cx="6.5" cy="18.5" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="13" height="11" rx="2" />
      <path d="m16 10.5 5-3.5v10l-5-3.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3.5l1.6-2.4a1.4 1.4 0 0 1 1.2-.6h3.4a1.4 1.4 0 0 1 1.2.6L16.5 8H20a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8Z" />
      <circle cx="12" cy="13.5" r="4" />
    </>
  ),
  coffee: <path d="M5 9.5h11v6a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 15.5Z M16 11.5h1.5a2.5 2.5 0 0 1 0 5H16" />,
  gift: (
    <>
      <path d="M4 12h16v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20Z" />
      <path d="M2.5 7.5h19V12h-19z M12 7.5V21 M12 7.5S10 4.5 8 4.5a2 2 0 1 0 .5 4H12M12 7.5S14 4.5 16 4.5a2 2 0 1 1-.5 4H12" />
    </>
  ),
  bell: <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.2 5.4 1.8 6a.9.9 0 0 1-.6 1.6H4.8a.9.9 0 0 1-.6-1.6c.6-.6 1.8-2 1.8-6ZM10 20.5a2 2 0 0 0 4 0" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.5 11.5 8.5-8.5M15.5 7.5 18 10M13 10l2 2" />
    </>
  ),
  home: (
    <>
      <path d="m4 11.5 8-7.5 8 7.5" />
      <path d="M6.5 10.5V20h11v-9.5" />
    </>
  ),
  building: (
    <>
      <path d="M5 21V4.5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 4.5V21M15 10h4a1.5 1.5 0 0 1 1.5 1.5V21M3 21h18M8.5 7h2M8.5 11h2M8.5 15h2" />
    </>
  ),
  flag: <path d="M6 21V4.5 M6 5h11l-2.75 4L17 13H6" />,
  mapPin: (
    <>
      <path d="M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  plane: <path d="M10.5 21l3-7.5L4 10.5 3 7l7.5 1 4.5-4.5a2.3 2.3 0 0 1 3.3 3.3L13.8 12l1 7.5-3.8 1.5Z" />,
  car: (
    <>
      <path d="M4 15.5V12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3.5M4 12l2-6a2 2 0 0 1 1.9-1.5h8.2A2 2 0 0 1 18 6l2 6" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  tree: (
    <>
      <path d="M12 3 7.5 9.5h2L5 15.5h6.5" />
      <path d="M12 3l4.5 6.5h-2L19 15.5h-6.5M12 15.5V21" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.8c1.7 2.2 1.7 4.9 0 7.1-1.7-2.2-1.7-4.9 0-7.1ZM21 12c-2.2 1.7-4.9 1.7-7.1 0 2.2-1.7 4.9-1.7 7.1 0ZM12 21.2c-1.7-2.2-1.7-4.9 0-7.1 1.7 2.2 1.7 4.9 0 7.1ZM3 12c2.2-1.7 4.9-1.7 7.1 0-2.2 1.7-4.9 1.7-7.1 0Z" />
    </>
  ),
  lightbulb: <path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.8.6 1.3 1.3 1.3 2.2h5c0-.9.5-1.6 1.3-2.2A6.5 6.5 0 0 0 12 2.5ZM10 21h4M11 24h2" />,
  rocket: (
    <>
      <path d="M12 2.5c3 2.5 4.5 6.5 4.5 10.5L13 16h-2l-3.5-3C7.5 9 9 5 12 2.5Z" />
      <path d="M9 13.5 6.5 16M15 13.5 17.5 16M12 16v5.5M10.5 23.5h3" />
    </>
  ),
  crown: <path d="M4 8.5 7.5 11 12 4.5 16.5 11 20 8.5 18.5 18h-13Z" />,
  gem: <path d="M7 4h10l4 5.5-9 11L3 9.5Z M3 9.5h18M9.5 4 8 9.5 12 20.5M14.5 4 16 9.5 12 20.5" />,
  apple: <path d="M12 8c-4-1.5-7 1-7 5.5S9.5 21 12 21s7-3 7-7.5S16 6.5 12 8ZM12 8V5a2.5 2.5 0 0 1 2.5-2.5" />,
  bookmark: <path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v16L12 16.5 5.5 21V5A1.5 1.5 0 0 1 7 3.5Z" />,
  inbox: (
    <>
      <path d="M3.5 13.5 6.8 6a2 2 0 0 1 1.9-1.4h6.6a2 2 0 0 1 1.9 1.4l3.3 7.5" />
      <path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5M3.5 13.5H10a2 2 0 0 0 4 0h6.5" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2" />
      <path d="M5.5 9v9A1.5 1.5 0 0 0 7 19.5h10a1.5 1.5 0 0 0 1.5-1.5V9M10 12.5h4" />
    </>
  ),
  tag: <path d="M20.2 12.3 12.7 19.8a1.9 1.9 0 0 1-2.7 0l-6-6V4h9.8l6.4 6.4a1.9 1.9 0 0 1 0 1.9Z M8.3 8.3h.01" />,
  wallet: (
    <>
      <path d="M4 7.5A2 2 0 0 1 6 5.5h11a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M16 12.5h4.5v3H16a1.5 1.5 0 0 1 0-3Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: <path d="M8 4.5h8V8a4 4 0 0 1-8 0ZM8 6H4.5a1 1 0 0 0-1 1c0 3 1.6 5 4.5 5M16 6h3.5a1 1 0 0 1 1 1c0 3-1.6 5-4.5 5M12 15v3M8.5 21h7M10 18h4" />,
  puzzle: <path d="M9.5 3.5a2 2 0 0 1 4 1.5v2h2.5a2 2 0 0 1 1.5 3.3l1.7 1.7a2 2 0 0 1-1.5 3.4H15v2a2 2 0 0 1-3.4 1.4l-1.7-1.6-1.7 1.6A2 2 0 0 1 4.7 19v-2H3.2a2 2 0 0 1-1.4-3.4l1.6-1.7-1.6-1.7A2 2 0 0 1 3.2 7h2.5v-2a2 2 0 0 1 3.8-.5Z" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0-7.5 13.5c.9 1.4 2.4 1 3.4.2 1.6-1.3.3-3.6 2.3-3.6 4.6 0 8.3-1 8.3-5C18.5 4.5 15.6 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="10" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  wrench: <path d="M14.5 6.5a5 5 0 0 0-6.4 6.4L3 18a2.3 2.3 0 0 0 3 3l5-5A5 5 0 0 0 17.4 7.6l-2.9 2.9-2.4-2.4Z" />,
  pin: <path d="M12 2.5c-3.6 0-6 2.4-6 6 0 5.3 6 12.5 6 12.5s6-7.2 6-12.5c0-3.6-2.4-6-6-6Z M12 10.5h.01" />,
  megaphone: <path d="M3 10.5 14 5v14L3 13.5ZM14 6.5a4.5 4.5 0 0 1 3 5M7.5 13.5l1.5 7h3l-1.5-7M10 10.5h11" />,
  umbrella: <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5h-19A9.5 9.5 0 0 1 12 2.5Z M12 12v6.5a2.5 2.5 0 0 0 5 0M12 2.5V1" />,
  gamepad: (
    <>
      <rect x="2.5" y="8" width="19" height="9" rx="4.5" />
      <path d="M8 11v3M6.5 12.5h3M15.5 11h.01M18 13h.01" />
    </>
  ),
  clapper: (
    <>
      <path d="M3.5 8.5 18.5 4l1.4 4.7-15 4.5Z" />
      <path d="M4.5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 19v-6.5" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1.4 1.4" />
      <path d="M13.5 10.5a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1.4-1.4" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 5.6 7.5-5.6" />
    </>
  ),
  phone: <path d="M5.5 4h3.6l1.7 4.4-2.3 1.4a11.5 11.5 0 0 0 5.7 5.7l1.4-2.3L20 14.9v3.6a1.9 1.9 0 0 1-1.9 1.9A15.5 15.5 0 0 1 3.6 5.9 1.9 1.9 0 0 1 5.5 4Z" />,
  tags: (
    <>
      <path d="M20.2 12.3 12.7 19.8a1.9 1.9 0 0 1-2.7 0l-6-6V4h9.8l6.4 6.4a1.9 1.9 0 0 1 0 1.9Z" />
      <circle cx="8.3" cy="8.3" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  duplicate: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15.5V5.5a2 2 0 0 1 2-2h10" />
    </>
  ),
};

/** Iconos elegibles para el encabezado de página y la barra lateral (catálogo tipo Notion, buscable). */
export const PAGE_ICONS: readonly IconName[] = [
  'doc', 'heading', 'quote', 'code', 'image', 'database', 'table', 'board', 'calendar', 'chart', 'clock',
  'star', 'heart', 'sun', 'moon', 'compass', 'keyboard', 'leaf', 'briefcase', 'book', 'folder', 'globe',
  'cloud', 'flame', 'zap', 'music', 'video', 'camera', 'coffee', 'gift', 'bell', 'lock', 'key',
  'home', 'building', 'flag', 'mapPin', 'plane', 'car', 'tree', 'flower', 'lightbulb', 'rocket', 'crown',
  'gem', 'apple', 'bookmark', 'inbox', 'archive', 'tag', 'wallet', 'target', 'trophy', 'puzzle', 'palette',
  'wrench', 'pin', 'megaphone', 'umbrella', 'gamepad', 'clapper',
  'phone', 'mail', 'link', 'hash', 'tags', 'checkSquare', 'toggle', 'callout', 'bulletList', 'numberedList',
  'file', 'info', 'pen',
];

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
