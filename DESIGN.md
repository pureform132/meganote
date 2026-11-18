---
name: MEGAnote Design System
description: The Paper Desk — local-first notes, ink on warm paper, terracotta action, sage state.
colors:
  paper: "#FDFCF8"
  ink: "#2E2A26"
  terracotta: "#C65D3B"
  terracotta-solid: "color-mix(in oklab, #C65D3B 80%, #2E2A26)"
  terracotta-solid-hover: "color-mix(in oklab, #C65D3B 68%, #2E2A26)"
  sage: "#9AA88A"
  paper-deep: "#211E1B"
  ink-bright: "#E9E3D6"
  terra-bright: "#CE6B45"
  sage-bright: "#ACB68E"
  glint: "#FFFFFF"
  shade: "#000000"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(30px, 4vw, 40px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.12em"
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, Menlo, Consolas, monospace"
    fontSize: "13px"
    lineHeight: 1.6
  micro:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 500
  caption-sm:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
  caption:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
  small:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  small-md:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
  body-sm:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  body-md:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
  body-lg:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  list-title:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
  quote:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    fontStyle: "italic"
  title-sm:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "19px"
    fontWeight: 600
  display-compact:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "26px"
    fontWeight: 600
  display-lg:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "30px"
    fontWeight: 600
  block-h1:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  xs: "2px"
  block: "4px"
  viewtab: "5px"
  focus: "3px"
  control: "6px"
  container: "10px"
  palette: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta-solid}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-solid-hover}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "9px 14px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  button-danger:
    backgroundColor: "#f4dcd2"
    textColor: "#a94f31"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  chip-pill:
    backgroundColor: "#f0ece1"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
---

# Design System: MEGAnote

## Overview

**Creative North Star: "The Paper Desk"**

MEGAnote is a well-kept paper desk that happens to be software. Warm paper ground, ink for writing, a single terracotta pencil for action, and a sage pencil for state — nothing else on the desk. The interface is a calm working surface: hairline ink rules, quiet margins, generous measure, and type that behaves like hand-set print. Chrome recedes; the notes lead. It is explicitly *not* a dashboard, not a marketing landing band, and not a Notion clone with a renamed logo: the structure is familiar (sidebar tree, editor canvas, database lenses), the material is its own.

Modeled as ink on paper: text sits directly on the ground with no card boxes; depth is conveyed by ink density and layering, not elevation; the only cast shadows belong to buttons, and they are volumetric — a colored lip under a rounded pill, the way a good pen presses into the page.

Shipped with a dark theme — **The Night Desk** — the same world at night, never a second palette: the four hues inverted (ember paper `#211E1B`, warm bright ink `#E9E3D6`, terracotta brightened `#CE6B45`, sage softened `#ACB68E`). Toggle lives in the sidebar footer (sun/moon), persists, and follows the OS on first run.

**Key Characteristics:**
- Four hues only: warm paper `#FDFCF8`, soft ink `#2E2A26`, terracotta `#C65D3B` (action/selection), sage `#9AA88A` (state/done/positive). Every derived tone is `color-mix(in oklab, <hue> …)` from these four — no fifth hue, ever.
- Serif display (Newsreader) for document titles; humanist sans (Hanken Grotesk) for all working UI; the mono stack only for code.
- Flat surfaces at rest; shadows appear on buttons only (plus floating menus, which float by necessity).
- Buttons are rounded pills with a volumetric 2px lip; fields are quiet rectangles with an ink border that deepens on focus.
- Icons are a custom 24px, 1.6-stroke round-cap SVG set; no unicode glyphs as icons.

## Colors

Four hues, all light, carrying distinct jobs.

### Primary
- **Terracotta Pencil** (#C65D3B): the action hue — active tree marker (ink-stroke tab), focus rings, selection wash, today's date. Used at small surface share by design. Primary buttons fill **Terracotta Solid** (`color-mix(in oklab, #C65D3B 80%, #2E2A26)`) so 13px/600 paper label text clears AA; hover deepens to the `68%` mix.

### Secondary
- **Sage Leaf** (#9AA88A): the state hue. Completed to-dos, callout fills (at 12–22% strength), positive database pills, checkbox check state, "Edited"/published tones, board Done column accent.

### Neutral
- **Warm Paper** (#FDFCF8): the ground. Body background, editor canvas.
- **Desk Paper** (`color-mix(in oklab, ink 3.2%, paper)`, ~#F7F5EF): sidebar ground — the margin of the desk.
- **Ink** (#2E2A26): text, rules, hairlines. All borders derive from ink at 8–14% mix; secondary text from ink at 38–72% mix — never pure gray.

### Named Rules

**The Night Desk Rule.** Dark mode is the same desk at night, never a different world: warm ember paper `#211E1B` (not blue-gray, not pure black), warm luminous ink `#E9E3D6`, terracotta brightened to `#CE6B45` to hold AA on the deep ground, sage softened to `#ACB68E`. The four hues are the same family inverted; every tint keeps deriving via `color-mix`. Glints and shadows use the documented `glint`/`shade` stops only. Neon never appears, and neither does a second "night accent".

**The Four-Pencil Rule.** Only paper, ink, terracotta, sage — and mixtures of them. No other hue may be introduced, including for "semantic" states; red is expressed as terracotta-deep, green as sage-deep. If a fifth color appears, the build is wrong.

**The Rarity Rule.** Terracotta holds ≤10% of any screen. Its power is scarcity; if the screen feels orange, remove ink mix, not ink.

## Typography

**Display Font:** Newsreader (Georgia fallback)
**Body Font:** Hanken Grotesk (system-ui fallback)
**Label/Mono Font:** Hanken Grotesk bold tracked caps for micro-labels; ui-monospace stack for code and keyboard hints.

**Character:** An editorial pairing — a soft, bookish serif with old-style warmth for moments of writing; a clean grotesque that stays invisible for work. Newsreader carries feeling; Hanken Grotesk carries function.

### Hierarchy
- **Display** (600, clamp(30px,4vw,40px), lh 1.15, ls -0.015em): page title and database name.
- **Headline** (600, 27px, lh 1.3, ls -0.01em): block H1.
- **Title** (600, 21px, lh 1.35): block H2; 15.5px/700 for H3.
- **Body** (400, 15px, lh 1.55): paragraphs and block content. Measure ~65–75ch at the 780px canvas.
- **Label** (700, 10px, ls 0.12em, uppercase): sidebar group labels, code-block language tag, calendar weekday header.

### Named Rules
**The Ink Measure Rule.** Body text never exceeds ~68ch (block content caps at 68ch; canvas caps at 780px with generous margins). Long lines are a layout bug.

## Layout

Fixed zones: a 264px sidebar (the notebook index: search, tree, favorites, trash) and a fluid paper canvas (`max-width: 780px`, centered, `padding: 34px 56px 140px`). Database pages widen the canvas to `1080px`. Block content caps at `68ch`. Eight-ish px rhythm with more space above headings than below (h2 carries `margin-top: 8–10px`). Under 900px, the sidebar becomes an overlay with backdrop and a fixed top bar appears. Respect `prefers-reduced-motion` globally.

## Elevation & Depth

**Ink layering, not elevation.** Surfaces are flat at rest and separate by tone (`paper` → `desk paper` → `paper-3` hover) and by hairline rules (`ink` at 8–14%). Cast shadows belong to buttons (volumetric pill lip, see Components) and to floating menus, where a tight `--shadow-lift` (1px ink line + 10px/14px soft ambient) keeps the popover legible on paper. Colored glow halos and glass blur are forbidden except the topbar's functional backdrop-blur on mobile.

**The Flat-Desk Rule.** If a surface wants a shadow, it must be a button or a transient menu. Everything else is ink, paper, and hairlines.

## Shapes

Soft-but-square: `6px` on controls (inputs, pills-of-less, table cells), `10px` on containers (callouts, table wrap, board columns, menus), `999px` on buttons and state pills. Borders are always 1px (or 2px for focus/accent), always ink-mixed, never colored. Dividers are a single `ink@14%` hairline. No clip-paths, no masks, no geometric ornament.

## Components

Buttons are the only lifted objects: pill-rounded (`999px`) with a volumetric stack — `inset 0 1px 0 paper@55%`, a 2px colored lip `0 2px 0 terra-deep`, and a soft terracotta ambient — compressing on `:active` and rising 1px on `:hover`.

### Buttons
- **Shape:** pill (999px); ghost and danger variants share the shape, toned down.
- **Primary:** terracotta fill, paper text, volumetric stack above; hover → `terra-hover` + 1px rise; active → 1px press.
- **Ghost:** paper fill, ink text, `ink@14%` lip; danger: `terra@45%` border on terracotta-soft wash, flips to solid terracotta on hover.

### Inputs / Fields
- **Style:** paper fill, `line-soft` border, 6px radius, caret terracotta; focus swaps the border for a 1.5px `sage-deep` inset ring (tables) or border-darken (search/sidebar). Titles are unstyled serif fields — no box at all.

### Chips / Pills (database selects, view tabs)
- **Style:** pill, `paper-3` fill (or `terra-soft`/`sage-soft` by tone), 6px dot in the tone hue, 11.5px/600 text. The active viewtab is paper-on-`paper-2` with terracotta text.

### Cards / Containers
- **Corner Style:** 10px. **Background:** paper or desk-paper. **Shadow Strategy:** none — 1px `line` border only. **Border:** `ink@14%` (outer) and `ink@8%` (row separators). Internal padding `8–12px`.

### Navigation (sidebar tree)
- **Style:** flat rows, 20px twisty hit area, 15px icon, depth indent 14px; active row = paper fill + authored terracotta ink-stroke tab at the leading edge (inline SVG, ~17px on a ~32px row ≈50% height, ≤7px wide, `currentColor`) + ink text; hover = desk-paper-3. Favorites group above the tree; trash pinned to the foot with a count badge.

### Signature: the slash menu
- A 284px paper popover (`10px` radius, `--shadow-lift`) listing insert-block commands with the custom icon chips; keyboard-first (`↑`/`↓`/`↵`), opens on `/` at any empty point in a block.

## Do's and Don'ts

### Do:
- **Do** use only the four hues (+ their `color-mix` derivatives). State red = terra-deep, state green = sage-deep.
- **Do** reserve terracotta for actions and the active marker; idle terracotta reads as an error.
- **Do** keep shadows on buttons and floating menus only; add none to static surfaces.
- **Do** set page titles in Newsreader 600 at clamp(30px,4vw,40px); body copy in Hanken Grotesk 400/15.
- **Do** keep hairline rules (`ink@8–14%`) as the only dividers; one per region.
- **Do** reuse the custom SVG icon set at 24px viewBox, 1.6 stroke.

### Don't:
- **Don't** introduce gradients, glassmorphism, or colored glows anywhere.
- **Don't** use a colored `border-left/right` thicker than a 2px hairline on cards, rows, callouts, or alerts.
- **Don't** ship emoji or unicode glyphs as the icon system (page content may use any character).
- **Don't** add a second accent hue "for semantics" — deepen terra or sage instead.
- **Don't** use system display faces (Impact, Arial Black) or load fonts from a CDN — fonts are self-hosted.
- **Don't** box the editor canvas; the writing surface is the ground itself.
