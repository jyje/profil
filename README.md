<div align="center">

# jyje/profil

AI-managed online presence for individuals and organizations —<br/>
portfolio · knowledge base (Obsidian) · per-position resumes (HTML/PDF/DOCX), from a single content source

[![check](https://github.com/jyje/profil/actions/workflows/check.yaml/badge.svg)](https://github.com/jyje/profil/actions/workflows/check.yaml)
[![GitHub stars](https://img.shields.io/github/stars/jyje/profil?style=social)](https://github.com/jyje/profil/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English](README.md) / [한국어](README-ko.md)

</div>

If this project helps you build your own profil, consider leaving a ⭐!

## Overview

**Profil** is your profile, the European way — one content source that drives
everything you show the world. This project gathers your scattered portfolio,
knowledge-base blog (Quartz-style), and resume builder into one place.

- **Single source of truth**: structured Markdown under `content/` drives everything
- **Multi-format output**: web pages, PDF, and DOCX derive from the same data
- **Position variants**: a different resume is assembled automatically for each position you apply to
- **AI harness**: an agent assists with content edits, build verification, and link integrity checks

## Monorepo structure

```
profil/
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
│   ├── cli/               # Internal CLI: profil init / check / add / list / remove / clean
│   └── site/               # Web template (portfolio/notes/resume tabs)
├── profil.config.yaml     # Languages, tabs, deploy target
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
git clone https://github.com/jyje/profil.git && cd profil
npm install         # packages/{jari,cli} build automatically on install (prepare)
npm run check       # static tests: tsc build + vitest + profil check
npm run dev        # local preview (M4)
npm run build       # full HTML + PDF + DOCX matrix build (M2)
```

## Internal CLI (`profil`)

```bash
npx profil init            # fully initialize a project in the current directory (scaffold + check)
npx profil init --home     # initialize the user data home (~/.profil) instead
npx profil init --force    # regenerate profil.config.yaml, content/resume, dist from templates
                           # (content/notes and content/portfolio are never overwritten)
npx profil check           # static checks: config/content schemas, position tags, wikilink integrity
npx profil build           # assemble + render per-position resumes into dist/ (md, html)
npx profil build --position mlops --format md   # narrow to one position/format
npx profil list [section]  # list resume entries (experience|projects|education|positions|skills)
npx profil add experience --company "ACME" --role "Engineer" --start 2024-01 --positions mlops
npx profil remove experience/acme.md   # paths are relative to content/resume
npx profil clean [--deep]  # remove build outputs (--deep: node_modules too)
```

**Data home** — when installed as a local tool, user data lives in `~/.profil/`
(`$HOME/.profil` on macOS/Linux, `%USERPROFILE%\.profil` on Windows). **Development
builds use `~/.profil-dev/`** so they never touch your real data — a build counts as
development when the version has a prerelease tag (e.g. `0.1.0-dev.0`), when
`NODE_ENV=development`, or when `PROFIL_DEV=1` (`PROFIL_DEV=0` forces release mode).
`PROFIL_HOME` overrides the location entirely. Every command resolves its project
root as: `--root <dir>` flag → walk up from the current directory → fall back to the
data home.

CI (`.github/workflows/check.yaml`) runs the same single entry point: `npm run check`.
See `packages/cli/README.md` for the full list of checks.

## Roadmap

- **M1** — Jari core: md parser, zod schema, canonical model, basic HTML renderer
- **M2** — Output matrix: PDF (Playwright), DOCX (Pandoc), build CLI, CI artifacts
- **M3** — Position variants + AI harness: position views, link integrity, agent workflow
- **M4** — Site integration: portfolio/notes tabs, self-hosted/cloud deployment

## License

MIT (design tokens and your own content may be licensed separately)
