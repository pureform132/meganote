import type { IconName } from './icons';

export interface PageIconChoice {
  id: IconName;
  label: string;
  keywords: string;
}

export interface PageIconGroup {
  name: string;
  icons: PageIconChoice[];
}

/** Authored sticker set for page headers — one visual family, four colors. */
export const PAGE_ICON_GROUPS: PageIconGroup[] = [
  {
    name: 'Esenciales',
    icons: [
      { id: 'doc', label: 'Documento', keywords: 'pagina documento nota' },
      { id: 'notebook', label: 'Cuaderno', keywords: 'cuaderno libreta diario' },
      { id: 'book', label: 'Libro', keywords: 'libro lectura' },
      { id: 'leaf', label: 'Hoja', keywords: 'hoja planta verde natural' },
      { id: 'sun', label: 'Sol', keywords: 'sol dia luz' },
      { id: 'moon', label: 'Luna', keywords: 'luna noche' },
      { id: 'moonStar', label: 'Luna y estrella', keywords: 'luna estrella noche' },
      { id: 'compass', label: 'Brújula', keywords: 'brujula viaje direccion' },
      { id: 'folder', label: 'Carpeta', keywords: 'carpeta archivo proyecto' },
      { id: 'briefcase', label: 'Maletín', keywords: 'trabajo maletin oficina' },
      { id: 'keyboard', label: 'Teclado', keywords: 'teclado atajos codigo' },
    ],
  },
  {
    name: 'Naturaleza',
    icons: [
      { id: 'sprout', label: 'Brote', keywords: 'brote planta crecer' },
      { id: 'flower', label: 'Flor', keywords: 'flor primavera jardin' },
      { id: 'mountain', label: 'Montaña', keywords: 'montana viaje cumbre' },
      { id: 'wave', label: 'Ola', keywords: 'ola mar agua playa' },
      { id: 'cloud', label: 'Nube', keywords: 'nube cielo clima' },
      { id: 'fish', label: 'Pez', keywords: 'pez mar animal' },
      { id: 'paw', label: 'Huella', keywords: 'huella mascota perro gato' },
      { id: 'globe', label: 'Mundo', keywords: 'mundo globo viaje idioma' },
    ],
  },
  {
    name: 'Vida',
    icons: [
      { id: 'coffee', label: 'Café', keywords: 'cafe taza manana pausa' },
      { id: 'cake', label: 'Tarta', keywords: 'tarta cumpleanos postre' },
      { id: 'pizza', label: 'Pizza', keywords: 'pizza comida cena' },
      { id: 'music', label: 'Música', keywords: 'musica nota cancion' },
      { id: 'camera', label: 'Cámara', keywords: 'camara foto recuerdo' },
      { id: 'gamepad', label: 'Mando', keywords: 'juego mando consola' },
      { id: 'bike', label: 'Bici', keywords: 'bici bicicleta deporte' },
      { id: 'plane', label: 'Avión', keywords: 'avion viaje vuelo' },
      { id: 'gift', label: 'Regalo', keywords: 'regalo cumpleanos sorpresa' },
      { id: 'rocket', label: 'Cohete', keywords: 'cohete lanzar idea rapido' },
    ],
  },
  {
    name: 'Símbolos',
    icons: [
      { id: 'heart', label: 'Corazón', keywords: 'corazon amor favorito' },
      { id: 'sparkles', label: 'Destellos', keywords: 'destellos magia ideas' },
      { id: 'star', label: 'Estrella', keywords: 'estrella favorito' },
      { id: 'bulb', label: 'Bombilla', keywords: 'bombilla idea luz' },
      { id: 'zap', label: 'Rayo', keywords: 'rayo energia rapido' },
      { id: 'target', label: 'Objetivo', keywords: 'objetivo meta diana' },
      { id: 'crown', label: 'Corona', keywords: 'corona rey logro' },
      { id: 'gem', label: 'Gema', keywords: 'gema diamante valor' },
      { id: 'bookmark', label: 'Marcador', keywords: 'marcador guardar' },
      { id: 'pin', label: 'Pin', keywords: 'pin lugar mapa' },
      { id: 'flag', label: 'Bandera', keywords: 'bandera hito pais' },
      { id: 'smile', label: 'Sonrisa', keywords: 'sonrisa cara feliz' },
      { id: 'gallery', label: 'Galería', keywords: 'galeria imagenes' },
      { id: 'chart', label: 'Gráfico', keywords: 'grafico datos' },
    ],
  },
];

export const ALL_PAGE_ICONS = PAGE_ICON_GROUPS.flatMap((g) => g.icons);

export function searchPageIcons(query: string): PageIconGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return PAGE_ICON_GROUPS;
  return PAGE_ICON_GROUPS.map((g) => ({
    ...g,
    icons: g.icons.filter((ic) => `${ic.label} ${ic.keywords} ${ic.id}`.toLowerCase().includes(q)),
  })).filter((g) => g.icons.length > 0);
}

export interface CoverPreset {
  id: string;
  label: string;
  className: string;
}

/** Covers are gradients made only with the four palette hues — no external images. */
export const COVERS: CoverPreset[] = [
  { id: 'sage', label: 'Salvia', className: 'cover--sage' },
  { id: 'terra', label: 'Terracota', className: 'cover--terra' },
  { id: 'paper', label: 'Papel', className: 'cover--paper' },
  { id: 'dawn', label: 'Amanecer', className: 'cover--dawn' },
  { id: 'dusk', label: 'Atardecer', className: 'cover--dusk' },
  { id: 'night', label: 'Noche', className: 'cover--night' },
];

export const COVER_BY_ID = new Map(COVERS.map((c) => [c.id, c]));
