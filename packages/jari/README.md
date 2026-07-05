# @profil/jari

An engine that takes structured Markdown (`content/resume/**/*.md`) as its
single source and generates HTML/PDF/DOCX resumes.

The name comes from assembling a different resume per position ("자리",
Korean for "seat/position").

## Status

`src/schema.ts` holds the data model, `src/parser.ts` the single-file parser,
`src/loader.ts` the directory loader, `src/assemble.ts` the per-position view
assembly, and `src/render/` the Markdown/HTML renderers. Implementation
proceeds in this order:

### M1 — Core
- [x] `loader.ts`'s `loadResumeModel(contentDir)`: scans the whole directory
      and assembles the canonical model (errors are collected instead of
      thrown — reported by the CLI's `check` command)
- [x] `assemble.ts`'s `assembleResume(model, { position, lang })`: filters
      experience/projects by position tag, sorts by `weight` (per-position
      priority) or `period` (ongoing first, then newest), narrows skill
      groups to the position
- [x] `render/markdown.ts` + `render/html.ts`: assembled view -> a single
      Markdown document / self-contained HTML page. HTML styling comes from
      `design.ts`'s `loadDesignTokens` (design/tokens.yaml with full
      defaults), print-ready per design/Design.md
- [ ] round-trip test: verify no content is lost through md -> model -> md

### M2 — Output matrix
- [ ] `render/pdf.ts`: HTML -> PDF via Playwright (reference the
      `pdf-config.yml` approach from jyje/profile)
- [ ] a script generating `reference.docx` from `design/tokens.yaml`
- [ ] `render/docx.ts`: a Pandoc invocation wrapper

## Usage example

```ts
import {
  loadResumeModel,
  assembleResume,
  renderHtml,
  loadDesignTokens,
} from "@profil/jari";

const { model } = await loadResumeModel("./content/resume");
const { assembled } = assembleResume(model!, { position: "mlops", lang: "ko" });
const { tokens } = loadDesignTokens(".");
const html = renderHtml(assembled!, tokens);
```

## Content authoring convention

See `content/resume/README.md`. In short: frontmatter is structure, the
body's first paragraph is the summary, and its bullet list is the achievement
highlights.
