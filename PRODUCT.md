# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript, local-first (IndexedDB). Chosen by the user over plain static HTML/CSS and Next.js. No backend; data never leaves the browser unless the user exports it.

## Users

Individuals who take notes and organize personal projects: notes, lists, ideas and documents of their own. Personal knowledge work, not team collaboration in v1.

## Product Purpose

A local-first notes app that recreates Notion's core functionality (block editor, nested pages, databases, search) as MEGAnote: opens instantly, works offline, no account, no cloud. Success = a user can replace Notion for personal note-taking and project organization without noticing what is missing, and can export their data at any time.

## Positioning

Notion's feature depth, delivered with the speed and simplicity of a local app: instant open, instant search, zero sign-in, zero telemetry. Reimplemented independently (no proprietary code or assets from Notion are reused); only the *functions and interactions* are mirrored.

## Operating Context

Used on a personal desktop machine, offline or online. Notes, documents, project tracking, personal databases (table/kanban/calendar). Content persists in the browser's IndexedDB with auto-save; clearing browser site data without a backup destroys notes, so one-click JSON backup/restore is always available in the sidebar footer.

## Capabilities and Constraints

Confirmed scope (v1):

- Block editor: paragraph, headings (H1–H3), bulleted list, numbered list, to-do, toggle, quote, code block, callout, divider, image block (local file / URL), markdown-style shortcuts, inline formatting (bold/italic/strike/code).
- File attachments: any file type as a block (≤8 MB), name + size shown, download-on-demand.
- Slash command menu (`/`) to insert blocks (14 block types, keyboard navigable).
- Nested pages (page tree), sidebar with tree, favorites, trash (soft delete + restore), full-text search (titles, blocks and database rows), quick-open command palette (Ctrl/Cmd+K).
- Multiple workspaces: create/switch/rename notebooks; per-notebook page tree; automatic v1→v2 migration into "Personal".
- Databases as pages with views: table, kanban board, calendar, bar chart (select axis or 6-month series); simple filters and sort; property edit/add/remove.
- Notion import: official "Markdown & CSV" export .zip → pages (with hierarchy), CSV → typed tables, relative images embedded as data URLs.
- Backup/restore: full-workspace JSON (download + validated restore with confirmation); per-page Markdown export; desktop build via PyInstaller + WebView2.
- Dark theme ("The Night Desk"), light default, manual toggle + OS default, persisted.
- Persistence in IndexedDB with debounced auto-save; live "Saved · time" indicator in the sidebar.
- Brand: "MEGAnote". Interface redesigned vs Notion; max 4 colors per theme, all light (deep warm ember in dark). Recommended palette applied: paper #FDFCF8, ink #2E2A26, terracotta #C65D3B, sage #9AA88A (tints/shades derived via color-mix count as the same hues).
- Spanish UI.

Explicitly out of scope / undecided:

- Real-time collaboration, multi-user workspaces, comments, mentions across users: not in v1.
- Accounts, cloud sync, AI features, meeting notes, calendar/mail integration, MCP host, desktop wrapper: excluded from v1 by user selection (features chosen: block editor + slash, pages + sidebar + search, databases).
- Visual world (typography, components, layout): decided and shipped — see DESIGN.md ("The Paper Desk").

## Brand Commitments

- Name: MEGAnote (product name may appear as "MEGAnote").
- Must NOT reuse Notion's name, logo, brand assets, proprietary copy, or code verbatim. Feature parity, independent implementation and art.
- Max 4 colors, all light; the warm paper palette above is the standing choice (user did not override it).

## Evidence on Hand

- Reverse-engineering analysis of the user's installed Notion desktop app (v7.44.0, MSIX) performed in this workspace; key artifacts: Electron shell (webpack), `config.json` route map (page routes `/p/…`, `/collection/…`, `/new`, `/inbox`, `/trash`, `/library`, `/meeting-notes`, `/chat`), local `notion.db` (better-sqlite3, offline cache), deep-link protocol `notion://`, offline-first architecture with local SQLite mirror, renderer chunks for internal tools. Analysis notes in `C:\Users\DAMSRIS NIBAL\AppData\Local\Temp\opencode\notion-analysis\`.
- Notion's editor implementation lives in its remote web app (app.notion.com / www.notion.so) and is NOT present locally; local code is the desktop shell only.
- No MEGAnote assets exist yet. No real user data, testimonials, benchmarks, or customer claims exist; future work must not fabricate them.

## Product Principles

1. Local first, instant always: opening, searching, typing must never wait on a network or an account.
2. Feature depth without bundle bloat: mirror Notion's core loop (write → organize → find), not its peripheral surface.
3. Data sovereignty: content lives with the user; everything can be exported, nothing phones home.
4. Calm craft: the interface is warm, editorial and quiet — decoration never announces itself; the notes lead.
5. Independent implementation: replicate behavior from observed function, never copy proprietary code or assets.

## Accessibility & Inclusion

No product-specific requirement was established. Default bar: keyboard-navigable editor and sidebar (focus ring visible), sufficient contrast of the four-color palette (ink on paper), reduced-noise motion. To be verified in the design pass.
