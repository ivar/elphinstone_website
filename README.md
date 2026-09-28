# Elphinstone Farm

Landing page for a a small-scale agritech solarpunk venture on the Sunshine Coast, BC.
Syntropic agroforestry lab, local and indigenous agriculture, and a collaborative workspace — rooted in the Salish Sea bioregion.
published at  <https://elphinstone.farm>

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview  # preview the production build
```

## Tech Stack

- [Vite](https://vite.dev/) — build tool
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS
- [DaisyUI v5](https://daisyui.com/) — component library
- [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Nunito](https://fonts.google.com/specimen/Nunito) — typography

## Projects

Each project is a folder under `content/projects/` holding an `index.md` and its photos.

- **New project:** `hugo new projects/my-project/index.md` (uses `archetypes/projects.md`).
- **New progress update:** copy photos into the project's folder, then add an entry under `updates:` in its `index.md`:

```yaml
updates:
  - date: 2026-05-10
    title: "First rows planted"
    text: "What happened, who helped. **Markdown** works."
    why: "Optional: the reasoning behind this step."
    photos:
      - src: "2026-05-rows.jpg"
        alt: "Describe the photo for screen readers"
        caption: "Optional caption"
```

Updates are shown newest first. Hugo resizes photos automatically, so full-size camera files are fine. A misspelled photo name shows a warning during the build (and a placeholder box in `npm run dev`).
The educational text is the page body below the front matter; use the `term` shortcode for definitions.
