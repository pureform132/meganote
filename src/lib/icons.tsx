/* Authored icon set for Takenotes — single stroke weight, round caps/joins. No unicode glyphs. */
import type { JSX } from 'react';

export type IconName =
  | 'logo' | 'doc' | 'sun' | 'compass' | 'keyboard' | 'leaf' | 'briefcase' | 'book' | 'folder'
  | 'search' | 'plus' | 'check' | 'x' | 'chevronRight' | 'chevronDown' | 'chevronUp'
  | 'star' | 'trash' | 'restore' | 'table' | 'board' | 'calendar' | 'filter' | 'sort'
  | 'text' | 'heading' | 'bulletList' | 'numberedList' | 'checkSquare' | 'toggle' | 'quote'
  | 'code' | 'callout' | 'divider' | 'image' | 'database' | 'info' | 'arrowRight'
  | 'pen' | 'clock' | 'dot' | 'export' | 'warning' | 'notebook'
  | 'import' | 'chart' | 'file' | 'download' | 'moon'
  /* page stickers & new page actions */
  | 'heart' | 'sparkles' | 'coffee' | 'cake' | 'music' | 'camera' | 'rocket' | 'bulb'
  | 'gift' | 'globe' | 'cloud' | 'flower' | 'mountain' | 'wave' | 'paw' | 'fish'
  | 'pizza' | 'gamepad' | 'bike' | 'plane' | 'pin' | 'flag' | 'target' | 'crown'
  | 'gem' | 'bookmark' | 'smile' | 'zap' | 'moonStar' | 'sprout'
  | 'gallery' | 'toc' | 'subpage' | 'pageLink' | 'copy' | 'move' | 'backlink' | 'cover'
  | 'chartLine' | 'chartDonut' | 'more';

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
  heart: (
    <path d="M12 20.2S4 15.4 4 9.4A4.4 4.4 0 0 1 12 6.8a4.4 4.4 0 0 1 8 2.6c0 6-8 10.8-8 10.8Z" strokeLinejoin="round" />
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" strokeLinejoin="round" />
      <path d="m18.5 15.5.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7Z" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 8.5h12V15a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3.5v2M12 2.5v3" />
    </>
  ),
  cake: (
    <>
      <path d="M4.5 20h15v-7h-15Z" strokeLinejoin="round" />
      <path d="M3.5 20h17M8 13V9M16 13V9" />
      <path d="M8 6.5c0-1 1.5-1.5 1.5-2.5M16 6.5c0-1 1.5-1.5 1.5-2.5" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5.5l10-2V16" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.5-2h8l1.5 2h3v11h-17Z" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="3.4" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 3c3.5 2 5.5 5.7 5.5 10L12 18l-5.5-5C6.5 8.7 8.5 5 12 3Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="m8.5 16.5-2 4 4-1M15.5 16.5l2 4-4-1" />
    </>
  ),
  bulb: (
    <>
      <path d="M9.5 18h5M10.5 21h3" />
      <path d="M8.2 14.3a6 6 0 1 1 7.6 0c-.8.7-1.3 1.6-1.3 2.7H9.5c0-1.1-.5-2-1.3-2.7Z" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9C9 9 7 7.8 7 6a2 2 0 0 1 4 0c0 1.5 1 3 1 3Zm0 0c3 0 5-1.2 5-3a2 2 0 0 0-4 0c0 1.5-1 3-1 3Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5Z" />
    </>
  ),
  cloud: (
    <path d="M7 18.5h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.5 3.5 0 0 0 7 18.5Z" />
  ),
  flower: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8C10.5 8.3 10 5.5 12 4c2 1.5 1.5 4.3 0 5.8ZM14.2 12c1.5-1.5 4.3-2 5.8 0-1.5 2-4.3 1.5-5.8 0ZM12 14.2c1.5 1.5 2 4.3 0 5.8-2-1.5-1.5-4.3 0-5.8ZM9.8 12C8.3 13.5 5.5 14 4 12c1.5-2 4.3-1.5 5.8 0Z" />
    </>
  ),
  mountain: (
    <>
      <path d="m3 19 6-10 4 6 2-3 6 7Z" strokeLinejoin="round" />
      <circle cx="17" cy="6" r="1.6" />
    </>
  ),
  wave: (
    <path d="M3 9c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 3 3M3 15c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 3 3" />
  ),
  paw: (
    <>
      <circle cx="8" cy="8" r="1.6" />
      <circle cx="12" cy="6.5" r="1.6" />
      <circle cx="16" cy="8" r="1.6" />
      <path d="M12 11c-3 0-5 2.2-5 4.5 0 1.6 1.3 2.5 2.6 2 1-.4 1.6-.6 2.4-.6s1.4.2 2.4.6c1.3.5 2.6-.4 2.6-2C17 13.2 15 11 12 11Z" />
    </>
  ),
  fish: (
    <>
      <path d="M4 12c3-4 7-5.5 11-4 1.5.5 2.8 1.3 4 2.5-1.2 1.2-2.5 2-4 2.5-4 1.5-8 0-11-1Z" />
      <path d="M19 10.5 22 8v8l-3-2.5" />
      <circle cx="8" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  pizza: (
    <>
      <path d="M12 3.5 21 20.5H3Z" strokeLinejoin="round" />
      <path d="M12 3.5c2.8 0 5.6 1 8 3" />
      <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  gamepad: (
    <>
      <path d="M6.5 7.5h11c2.5 0 4 2.5 3.5 5.2l-1 4.3c-.3 1.3-1.9 1.7-2.8.8l-1.6-1.6H8.4l-1.6 1.6c-.9.9-2.5.5-2.8-.8l-1-4.3C2.5 10 4 7.5 6.5 7.5Z" />
      <path d="M8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="17" r="3.5" />
      <circle cx="18" cy="17" r="3.5" />
      <path d="M6 17 10 8h4l4 9M9 8h5M14 8l3 4" />
    </>
  ),
  plane: (
    <>
      <path d="M3.5 13.5 20.5 4l-4 9.5-4.5 2-2 5-2-5-4.5-2Z" strokeLinejoin="round" />
      <path d="m12 15.5 4.5-2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  flag: <path d="M5.5 21V4M5.5 5h11l-2 4 2 4h-11" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  crown: (
    <>
      <path d="m4 8 4 3 4-6 4 6 4-3-1.5 10h-13Z" strokeLinejoin="round" />
      <path d="M6.5 21h11" />
    </>
  ),
  gem: (
    <>
      <path d="M7 4h10l4 5-9 11L3 9Z" strokeLinejoin="round" />
      <path d="M3 9h18M9 4l-2 5 5 11 5-11-2-5" />
    </>
  ),
  bookmark: <path d="M6 3.5h12V21l-6-4-6 4Z" strokeLinejoin="round" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c.8 1.4 2 2.2 3.5 2.2s2.7-.8 3.5-2.2" />
      <circle cx="9" cy="9.8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.8" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  zap: <path d="M13 2.5 4.5 14H11l-1 7.5L19.5 10H13Z" strokeLinejoin="round" />,
  moonStar: (
    <>
      <path d="M20 14.2A8.2 8.2 0 1 1 9.8 3.5 6.5 6.5 0 0 0 20 14.2Z" strokeLinejoin="round" />
      <path d="m17.5 3.5.6 1.8 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6Z" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13C8 13 5 10.5 5 6c4.5 0 7 2.5 7 7Z" />
      <path d="M12 11c4 0 7-2.5 7-6.5-4.5 0-7 2.5-7 6.5Z" />
    </>
  ),
  gallery: (
    <>
      <rect x="3.5" y="4.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="4.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="14.5" width="7" height="5" rx="1" />
      <rect x="13.5" y="14.5" width="7" height="5" rx="1" />
    </>
  ),
  toc: <path d="M4 6h3M9.5 6H20M4 12h3M9.5 12H20M4 18h3M9.5 18H16" />,
  subpage: (
    <>
      <path d="M7 3.5h7L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M13.5 3.5V8H18.5M9 14h6M12 11v6" />
    </>
  ),
  pageLink: (
    <>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M8 16.5 6.5 18a3.5 3.5 0 0 1-5-5L5 9.5a3.5 3.5 0 0 1 5 0" />
      <path d="M16 7.5 17.5 6a3.5 3.5 0 0 1 5 5L19 14.5a3.5 3.5 0 0 1-5 0" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
  move: (
    <>
      <path d="M3.5 7A2 2 0 0 1 5.5 5h4l2 2.5h7A2 2 0 0 1 20.5 9.5v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path d="M9 14h6M13 11l3 3-3 3" />
    </>
  ),
  backlink: (
    <>
      <path d="M9 8H6a4 4 0 0 0 0 8h3M15 16h3a4 4 0 0 0 0-8h-3" />
      <path d="M8 12h8" />
    </>
  ),
  cover: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m3 17 5-5 4 4 3-3 6 6" />
      <circle cx="8" cy="9" r="1.4" />
    </>
  ),
  chartLine: (
    <>
      <path d="M4 4v16h16" />
      <path d="m7 15 4-4 3 2.5 5-6.5" />
    </>
  ),
  chartDonut: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v4.5M20.5 12H16" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
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
