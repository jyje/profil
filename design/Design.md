# Design.md

This document is the human-readable explanation of `design/tokens.yaml`. To
change a design decision, read the principles here and then edit
tokens.yaml. AI agents should also read this file first for any
design-related request.

## Direction

Homage the "striking personal site" spirit of Hydejack, but prioritize
keeping the same design language consistent across both the static site and
print output (PDF/Word). Avoid designs that look great on the web but fall
apart when printed.

## Color

- Designed so brand identity is expressed by changing `accent` alone; every
  other color stays neutral.
- Print output defaults to no background color (saves ink, works for
  black-and-white printing). Override with `print.use_background: false` in
  tokens if needed.

## Typography

- Separate body/heading fonts to keep the hierarchy clear (an homage to
  Hydejack's Roboto Slab + Noto Sans pairing).
- Pretendard is the default Korean web font; always test the system-font
  fallback for print (PDF rendering has web-font loading timeout issues —
  see `timeout.fonts` in `pdf-config.yml`).

## Layout

- The resume is single-column, designed around a 720px max width — this
  naturally matches A4 print margins.
- The portfolio/knowledge-base tabs allow a sidebar + content two-column
  layout (an homage to Hydejack's sidebar).

## Checklist for changes

1. Edit `design/tokens.yaml`
2. `npm run build:design` — regenerates the CSS variable file + reference.docx
3. `npm run build` — rebuilds web/PDF/DOCX in full
4. Compare the web, PDF, and DOCX outputs side by side to verify
