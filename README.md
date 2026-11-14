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

Each project is a folder under `content/projects/` holding an `index.md`. Photos live in the `elphinstone-media` R2 bucket, in a folder named after the project.

- **New project:** `hugo new projects/my-project/index.md` (uses `archetypes/projects.md`).
- **New progress update:** upload photos to the bucket (e.g. `npx wrangler r2 object put elphinstone-media/my-project/2026-05-rows.jpg --file ./2026-05-rows.jpg --remote`), then add an entry under `updates:` in its `index.md`:

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

Updates are shown newest first. Hugo resizes photos automatically, so full-size camera files are fine. Photos are fetched from `mediaBaseURL` (set in `hugo.toml`) at build time; a photo saved next to `index.md` also works and takes precedence. A misspelled photo name shows a warning during the build (and a placeholder box in `npm run dev`).
The educational text is the page body below the front matter; use the `term` shortcode for definitions.

### Projects map

The top of `/projects/` is an overhead photo of the western half of the property with a marker linking to each project. To place a project on it, add a `location` to its `index.md`; `x` and `y` are percentages from the left and top of the photo:

```yaml
location:
  x: 48.4
  y: 31.3
  label: "left"   # optional: put the label left of the marker
  area: [[20, 62], [55, 66], [50, 88], [24, 86]]   # optional: corners of a highlighted, clickable patch
```

In `npm run dev`, click the photo on `/projects/` and it shows (and copies) the snippet for that spot. Click around the edge of a patch (three or more points) and the snippet includes an `area` for it; "Start a new area" resets the points. Projects without a `location` only appear in the cards below the photo.

By default the photo is the Sunshine Coast Regional District's 2024 aerial photo, fetched at build time for the area set under `[params.propertyMap]` in `hugo.toml`, with the property boundary drawn over it. To use a newer photo (e.g. a drone shot), save it as `assets/images/property-overhead.jpg`; it replaces the fetched photo, the boundary line is no longer drawn, and the markers need re-placing.

### Species list

`/projects/species/` lists every species recorded on [iNaturalist](https://www.inaturalist.org/) inside the property boundary (`data/property_boundary.json`). `npm run build` refreshes it; `npm run species` refreshes just the data file, `data/species.json`. That file is committed so the page still builds if iNaturalist is unreachable. To add a species, post an observation on iNaturalist from the property; it appears after the next build once it is identified to species.
