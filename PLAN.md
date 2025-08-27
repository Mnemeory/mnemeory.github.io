# CSS Deduplication Plan

## Duplicates
| symbol | canonical file | duplicates to remove | affected call sites count |
|---|---|---|---|
| `.liquid-text`, `.flowing-word` | css/layout.css | css/components/neural-particles.css | 0 |
| header styles (`.nlom-header`) | css/layout.css (`.neural-command-interface`) | css/components/navigation.css (`.nlom-header` block) | 0 |
| width utility (`.w-100`) | css/utilities.css (`.w-full`) | css/utilities.css (`.w-100`) | 0 |

## Outdated References
- style.css: commented import of deprecated `neural-particles.css`.
- responsive.css: references to `.nlom-header`, `.neural-particles`, and utility classes slated for removal.
- component comments referencing `.base-ripples` system which is no longer used.

## Orphans
| file or selector | reason removable |
|---|---|
| css/components/neural-particles.css | unused duplicate definitions of `.liquid-text` & `.flowing-word` |
| `.nlom-header` block in navigation.css & responsive.css | class not present in markup |
| `.federation-emblem`, `.nlom-title`, `.header-content`, `.consular-identity`, `.liquid-text-button`, `.consular-designation`, `.constellation-nav`, `.nav-toggle`, `.nav-icon`, `.nav-menu`, `.nav-link` | no references in HTML/JS |
| `.github-export-status*` | unused status badges |
| `.base-bubble`, `.base-float`, `.base-morph`, `.base-glow-hover` | unused utility classes |
| `.base-ripples*` and related ripple keyframes (`ripple-simple`, `ripple-organic`, `ripple-float`, `ripple-pulse`, `ripple-outer`) | ripple system unused |
| `.base-action-btn*` | unused legacy button utilities |
| `.w-full`, `.h-full`, `.w-100` | unused width/height utilities |
| `.backdrop-blur-subtle`, `.backdrop-blur-light`, `.backdrop-blur-medium`, `.backdrop-blur-strong`, `.backdrop-blur-heavy` | unused backdrop blur helpers |
