---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface brief: Takenotes — app shell (Operate)

## Scope and mode

Operate surface, full app screen (not a landing page). The visitor came to get a job done: write, organize, find. Local-first web app, React + Vite + TS, IndexedDB persistence. No backend in v1.

## Audience, job, constraints

Individuals organizing personal notes and projects (PRODUCT.md). Job: capture a thought, structure it later, find it fast. Constraints: max 4 colors, all light; Takenotes branding, independent implementation; must read as a product of its category (notes/wiki), not a poster; controls are standard web components; keyboard-first (Ctrl/Cmd+K palette); motion exponential ease-out, quiet; must state its local/offline nature honestly.

## Chosen direction

A well-kept paper desk, reimagined as software: warm paper ground, ink text, terracotta for action and selection, sage for secondary state. Notion-like structure (sidebar tree + editor + database views), redesigned material: serif display title, sans body, generous margins, hairline rules, no card sprawl, no hero marketing.

## Memorable moment

Typing `/` in an empty page summons a slash menu that feels like a fountain pen arriving on the desk — instant, inked, keyboard-driven, zero chrome.

## THESIS

The notes app as a well-kept paper desk: a calm working surface, not a dashboard and not a marketing page. Refuses the gray admin-shell default and the "Notion clone with different logo".

## OWN-WORLD

Paper `#FDFCF8` ground, ink `#2E2A26` text/rules, terracotta `#C65D3B` for actions, selection and the active page marker, sage `#9AA88A` for secondary states and database view chips. Self-hosted display serif + workhorse humanist sans; hairline ink-tinted rules; square-cornered controls with one radius token (10px containers, 6px controls); no gradients, no glass, no shadows except one soft paper-lift on hover.

## STORY

A person opens Takenotes offline, their notebook is already there; they type a thought into a blank page, summon the slash menu, file it under a project, close the tab. Everything was instant, private, and theirs.

## FIRST VIEWPORT

Left sidebar (264px): wordmark "Takenotes", search field (`Ctrl/Cmd+K` hint), "New page" terracotta pill button, page tree with twisties, favorites group, trash at the bottom. Center (fluid): editor on paper with the page title in display serif, blocks below, empty-state prompt line. Right: none by default; command palette overlays center. The signature move: the active page in the sidebar carries a small terracotta ink-stroke tab at its leading edge — an authored SVG glyph (≤30% of row height), not a full-height accent bar.

## FORM

Operate shell, code-led; direction pinned whole by the user brief (brand redesign, 4 light colors, React+Vite). seed: none (pinned)

## FINISH

unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- Display/body faces: resolved at build time with font-match-equivalent judgment; candidates: Newsreader (display) + Hanken Grotesk or similar (body); must be self-hosted, never Google-hosted.
- Export format (markdown) deferred.
