# NetWatch Badges (GitHub Pages Ready)

## Folder Structure
- `index.html` — Barebones viewer/editor that dynamically builds buttons and loads SVGs from `badges.json`.
- `badges.json` — Manifest list of badge entries.
- `svg/*.svg` — Standalone SVG files for each rank.

## Adding a New Badge SVG
1. Drop `.svg` file into `svg/` (for example, `svg/director.svg`).
2. Add new object to `badges.json`:
```json
{
  "id": "director",
  "label": "DIRECTOR",
  "file": "./svg/director.svg"
}
```
