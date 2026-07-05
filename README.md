<div align="center">

# jyje/madang

AI-managed online presence for individuals and organizations —<br/>
portfolio · knowledge base (Obsidian) · per-position resumes (HTML/PDF/DOCX), from a single content source

[![build](https://github.com/jyje/madang/actions/workflows/build.yml/badge.svg)](https://github.com/jyje/madang/actions/workflows/build.yml)
[![GitHub stars](https://img.shields.io/github/stars/jyje/madang?style=social)](https://github.com/jyje/madang/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English](README.md) / [한국어](README-ko.md)

</div>

If this project helps you build your own madang, consider leaving a ⭐!

## Overview

*Madang* (마당) is the open courtyard of a traditional Korean house — the place where
you welcome guests and lay out what you have to show. This project gathers your
scattered portfolio, knowledge-base blog (Quartz-style), and resume builder into
**one madang**.

- **Single source of truth**: structured Markdown under `content/` drives everything
- **Multi-format output**: web pages, PDF, and DOCX derive from the same data
- **Position variants**: a different resume is assembled automatically for each position you apply to
- **AI harness**: an agent assists with content edits, build verification, and link integrity checks

## Monorepo structure

```
madang/
├── AGENTS.md            # Working conventions for AI agents (Claude Code, etc.)
├── design/
│   ├── tokens.yaml       # Colors/typography/spacing — single design truth
│   └── Design.md         # Design system docs (for humans + AI)
├── content/
│   ├── resume/           # Resume data (structured Markdown)
│   │   ├── basics.md
│   │   ├── experience/*.md
│   │   ├── projects/*.md
│   │   ├── education/*.md
│   │   ├── skills.md
│   │   └── positions/*.md   # Per-position view definitions (filter/sort rules)
│   ├── portfolio/*.md    # Portfolio entries
│   └── notes/            # Obsidian vault (knowledge-base tab)
├── packages/
│   ├── jari/              # Resume engine: parse → model → render(html/pdf/docx)
│   ├── cli/               # Internal CLI: madang init / check / clean
│   └── site/               # Web template (portfolio/notes/resume tabs)
├── madang.config.yaml     # Languages, tabs, deploy target
└── dist/                  # Build outputs: {name}-{position}-{lang}.{pdf,docx}
```

## Why structured Markdown

Resume data is written as **structured Markdown** instead of YAML. Frontmatter holds
the structure (company, period, tags) while the body holds rich text (summary,
highlight bullets), so it maps 1:1 to YAML without loss. At the same time you can
open the files directly in Obsidian's properties panel, and `[[wikilinks]]` connect
them naturally to your portfolio and knowledge base.

## Quick start

```bash
git clone https://github.com/jyje/madang.git && cd madang
npm install         # packages/{jari,cli} build automatically on install (prepare)
npm run check       # static tests: tsc build + vitest + madang check
npm run dev        # local preview (M4)
npm run build       # full HTML + PDF + DOCX matrix build (M2)
```

## Internal CLI (`madang`)

```bash
npx madang init            # fully initialize a project in an empty directory (scaffold + check)
npx madang init --force    # regenerate madang.config.yaml, content/resume, dist from templates
                           # (content/notes and content/portfolio are never overwritten)
npx madang check           # static checks: config/content schemas, position tags, wikilink integrity
npx madang clean [--deep]  # remove build outputs (--deep: node_modules too)
```

CI (`.github/workflows/build.yml`) runs the same single entry point: `npm run check`.
See `packages/cli/README.md` for the full list of checks.

## Roadmap

- **M1** — Jari core: md parser, zod schema, canonical model, basic HTML renderer
- **M2** — Output matrix: PDF (Playwright), DOCX (Pandoc), build CLI, CI artifacts
- **M3** — Position variants + AI harness: position views, link integrity, agent workflow
- **M4** — Madang site integration: portfolio/notes tabs, self-hosted/cloud deployment

## License

MIT (design tokens and your own content may be licensed separately)
