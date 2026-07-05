# AGENTS.md

This document is the convention Claude Code (or any other coding agent) follows
when working in this repo. Humans should read it too. This is a global
open-source project — all source code, comments, and commit messages must be
in English (see `.claude/skills/git-commit-helper/SKILL.md`).

## What this project is

Profil is a personal/organization website template that manages a resume
(Jari engine) + portfolio + knowledge base (Obsidian-linked) from a single
content source. `content/resume/*.md` is the single source of truth for the
resume; HTML/PDF/DOCX are derived from it.

## Principles for content work

1. **Edit resume data only as structured Markdown under `content/resume/`.**
   Never hand-edit the generated HTML, PDF, or DOCX — always regenerate them
   via the build.
2. **Frontmatter follows the schema.** The zod definitions in
   `packages/jari/src/schema.ts` are the source of truth. Change the schema
   first if a new field is needed, then fill in content.
3. **Infer and fill in position tags (`positions: [...]`).** When adding a
   new experience/project entry, decide which position(s) defined in
   `content/resume/positions/*.md` it relates to — ask the user if it's
   ambiguous, otherwise make a reasonable inference.
4. **Change design only through `design/tokens.yaml`.** Never hand-edit CSS
   or `reference.docx` directly — generate them from the tokens.
5. **Always run the static checks after adding or editing content:**
   ```bash
   npm run check   # = tsc build + vitest + profil check (schema/position/wikilink integrity)
   ```
   If you only changed content, `npm run profil -- check` (or `npx profil check`)
   is enough. Resolve any schema violation or link-integrity error (a
   `[[wikilink]]` pointing at a note that doesn't exist) before moving on.
6. **Summarize the diff for the human before committing.** Resume/portfolio
   content is personal data — never commit or push automatically; get
   confirmation first.

## Typical workflow example

**On a request like "add this project to my resume":**
1. Create a new md file under `content/resume/projects/` (frontmatter +
   summary + achievement bullets). `profil add project --title ... --positions ...`
   does the schema validation in one step.
2. Infer the relevant position tag(s) (check `positions.md`, ask if unclear).
3. Link to related notes/portfolio entries via the `links:` field if any exist.
4. Verify with `npm run check`.
5. Summarize the change and confirm before committing.

## Don'ts

- Don't hand-edit anything under `dist/` (build-generated only).
- Don't run `profil init --force` without user confirmation — it resets
  `content/resume/` from the template, deleting real resume data.
- Don't add arbitrary fields to frontmatter that aren't in the schema (extend
  the schema first).
- Don't run `git push` or trigger a deploy without user confirmation.
- Don't rename files under `content/notes/` (the Obsidian vault) casually —
  it breaks wikilinks and permalinks. If a rename is needed, add a redirect
  at the same time.
