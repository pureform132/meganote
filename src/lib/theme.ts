/* Tema claro/oscuro — toma el valor guardado (con migración de la clave antigua),
   o el esquema del SO la primera vez. */
export type Theme = 'light' | 'dark';
const KEY = 'meganote.theme';
const LEGACY_KEY = 'meganote.theme';

export function currentTheme(): Theme {
  let saved = localStorage.getItem(KEY);
  if (saved !== 'light' && saved !== 'dark') {
    saved = localStorage.getItem(LEGACY_KEY);
    if (saved === 'light' || saved === 'dark') localStorage.setItem(KEY, saved);
  }
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function initTheme(): void {
  applyTheme(currentTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem(KEY, next);
  applyTheme(next);
  return next;
}
