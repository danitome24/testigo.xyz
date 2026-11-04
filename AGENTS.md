# AGENTS.md

Guidance for AI coding agents working on this repository.

## Project overview

Testigo is a static Astro + Tailwind CSS site that generates blank, printable documents to help someone's heirs recover their crypto seed phrases: recovery instructions, per-seed backup sheets, and optional passphrase sheets. The user only configures structure (number of seeds, word counts, locations, trusted people); all sensitive details are handwritten on the printed paper.

## Core principles (do not break these)

- **Privacy first.** Everything runs in the browser. No backend, no cookies, no analytics, no `localStorage`/`sessionStorage`/IndexedDB. Configuration lives in memory only.
- **No third-party requests.** Do not add CDNs, external fonts, trackers or remote assets. Fonts are self-hosted via `@fontsource`. The site must work under `default-src 'self'; style-src 'self' 'unsafe-inline'`.
- **Never handle seed words.** The app must never ask for, store or transmit any seed phrase word or passphrase. Sheets are printed blank.
- **Escape user-facing output.** Any dynamic string inserted into document HTML must go through `esc()` in `src/lib/documents.ts`.

## Language

- The site's UI and generated documents are in **Spanish**. Keep user-facing copy in Spanish unless asked otherwise.
- Code comments are currently in Spanish; new code and docs may be in English. `README.md` and `AGENTS.md` are in English.

## Tech stack

- Astro 7 (static output), TypeScript (strict, `astro/tsconfigs/strict`)
- Tailwind CSS 4 via `@tailwindcss/vite`
- Node.js >= 22.23.4 (see `.nvmrc`)

## Commands

```bash
npm install
npm run dev       # dev server at http://localhost:4321
npm run build     # static build to dist/
npm run preview   # serve dist/ locally
npx astro check   # type-check (if @astrojs/check is installed)
```

There is no test suite or linter configured yet. At minimum, run `npm run build` before considering a change done, and check the generator page in the browser (preview + print layout) for UI changes.

## Layout

```
src/
  components/           Header, Footer, SheetsMock (hero illustration)
  layouts/Base.astro    Shared HTML shell
  lib/documents.ts      Config types, limits and HTML templates for the three documents
  pages/index.astro     Landing page
  pages/generador.astro Generator form, preview and print
  scripts/generator.ts  Form state, preview rendering and print logic
  styles/global.css     Tailwind tokens and sheet styles (screen + @media print)
public/                 Static assets (favicon)
```

## Conventions

- Document text/templates live in `src/lib/documents.ts`; form behaviour lives in `src/scripts/generator.ts`. Keep that split.
- Limits (`MAX_SEEDS`, `MAX_PLACES`, `MAX_PP_PLACES`, `MAX_PEOPLE`) and `WORD_COUNTS` are defined in `documents.ts`; reuse them instead of hardcoding numbers.
- Print styling matters: changes to sheet markup should be checked in print preview (A4) as well as on screen.
- Pin dependency versions exactly in `package.json`.
- Do not commit `dist/`, `.astro/` or `node_modules/`.
