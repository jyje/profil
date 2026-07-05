# @profil/jari

An engine that takes structured Markdown (`content/resume/**/*.md`) as its
single source and generates HTML/PDF/DOCX resumes.

The name comes from assembling a different resume per position ("자리",
Korean for "seat/position").

## Status

`src/schema.ts` holds the data model, `src/parser.ts` the single-file parser,
and `src/loader.ts` the directory loader. Implementation proceeds in this
order:

### M1 — Core
- [x] `loader.ts`'s `loadResumeModel(contentDir)`: scans the whole directory
      and assembles the canonical model (errors are collected instead of
      thrown — reported by `@profil/cli`'s `check` command)
- [ ] round-trip test: verify no content is lost through md -> model -> md
- [ ] `render/html.ts`: canonical model -> a single HTML page (using design
      token CSS variables)
- [ ] `positions/*.md` filtering logic: sort experience/projects by tag + weight

### M2 — Output matrix
- [ ] `render/pdf.ts`: HTML -> PDF via Playwright (reference the
      `pdf-config.yml` approach from jyje/profile)
- [ ] a script generating `reference.docx` from `design/tokens.yaml`
- [ ] `render/docx.ts`: a Pandoc invocation wrapper
- [ ] CLI: `jari build [--position mlops] [--lang ko] [--format pdf,docx,html]`

## Usage example (target API once M1 is done)

```ts
import { loadResumeModel } from "@profil/jari";
import { renderHtml } from "@profil/jari/render/html";

const model = await loadResumeModel("./content/resume");
const html = renderHtml(model, { position: "mlops", lang: "ko" });
```

## Content authoring convention

See `content/resume/README.md`. In short: frontmatter is structure, the
body's first paragraph is the summary, and its bullet list is the achievement
highlights.
