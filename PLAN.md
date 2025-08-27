# CSS Deduplication Plan

## Modern Baseline
- Target browsers: latest two versions of Chrome, Firefox, Safari, and Edge.
- JavaScript: ES2020+ modules with `fetch` and `async`/`await`.
- CSS: Flexbox/Grid and custom properties; vendor prefixes dropped for baseline features.

### Recent Cleanup
- Removed prefixed `backdrop-filter` and legacy font/overflow properties.
- Dropped remaining vendor-prefixed scrollbar and text clipping rules; deleted unused scrollbar utility.

## Status
- No remaining duplicates or legacy selectors.
