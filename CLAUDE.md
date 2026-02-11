# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check + Vite production build (`tsc && vite build`)
- `npm run preview` — Serve the production build locally

## Architecture

Static landing page for Elphinstone Farm built with Vite + Tailwind CSS v4 + DaisyUI v5. No frontend framework — all content lives directly in `index.html`.

- **`index.html`** — Full page content (logo, hero, cards, footer with newsletter overlay)
- **`src/main.ts`** — Only imports `style.css` (no runtime JS logic)
- **`src/style.css`** — Tailwind v4 setup, DaisyUI plugin, and custom `elphinstone` theme
- **`public/images/`** — Static assets (logo.png, footer.png)

## Styling

Uses Tailwind CSS v4 syntax (`@import "tailwindcss"`, `@plugin`, `@theme` directives). DaisyUI components (`card`, `btn`, `hero`, `join`) are used throughout.

The custom `elphinstone` DaisyUI theme is defined in `src/style.css` and activated via `data-theme="elphinstone"` on `<html>`. Colors use OKLCH and represent the landscape: primary=mountain teal, secondary=forest green, accent=golden sun. Main text color is `#404949`.

**Fonts:** Fraunces (serif, headings) and Nunito (sans-serif, body) loaded from Google Fonts. Base font size is 125%.
