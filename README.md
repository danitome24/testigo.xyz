# Testigo

A static website built with Astro and Tailwind CSS that generates blank, printable documents so your heirs can recover your seed phrases:

- **Recovery instructions for my heirs**: the index for everything. First steps, scams, recovery with Rabby (or with a hardware wallet), trusted people and, at the end, which seeds exist and where each copy is kept.
- **Backup sheets**: one page per seed phrase and location (each location keeps a copy of all of them), with lines for 12, 15, 18, 21 or 24 words.
- **Passphrase sheets**: only if a seed uses one, so they can be stored separately.

The generator only asks for structure (number of seeds, locations and people; copies are derived from the locations); aliases, locations and names are handwritten on paper. Everything is generated in the browser. There is no backend, no cookies, no analytics and no storage: the configuration lives in memory and disappears when the tab is closed. Fonts are self-hosted, so the site makes no third-party requests.

## Development

Requires Node.js 22.23.4 or later (see `.nvmrc`; with nvm, just run `nvm use`).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # generates dist/
npm run preview   # serves dist/ locally
```

## Structure

```
src/
  components/      Header, footer and the hero sheets illustration
  layouts/Base.astro
  lib/documents.ts  HTML templates for the three documents (edit the copy here)
  pages/
    index.astro      Landing page
    generador.astro  Form, preview and printing
  scripts/generator.ts  Form state and printing logic
  styles/global.css     Tailwind tokens and sheet styles (screen and print)
```

## Deploying

`dist/` is static HTML: it works on Netlify, Vercel, Cloudflare Pages or GitHub Pages with no extra configuration. It is recommended to add a strict Content-Security-Policy header at the hosting level (`default-src 'self'; style-src 'self' 'unsafe-inline'`), since the site does not need to load anything external.
