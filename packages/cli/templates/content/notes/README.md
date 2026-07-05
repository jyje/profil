# content/notes/ — knowledge base (Obsidian vault)

Treat this directory as an Obsidian vault (in Obsidian, "Open folder as
vault" pointed directly at `content/notes/`). This is the migration target
for jyje/docs.

## Conventions

- The filename is the permalink slug. `[[wikilinks]]` resolve based on the
  filename.
- Renaming a file breaks links — if a rename is needed, add a redirect entry
  to `content/notes/_redirects.yaml` (introduced in M4).
- Web rendering approach is decided in M4: initially, Quartz is built
  separately and embedded under the `/notes` subpath; the goal is to later
  replace it with a native renderer (Astro + remark-wiki-link, etc.).

## Linking to the portfolio/resume

`content/resume/**/*.md` and `content/portfolio/**/*.md` can reference notes
in this vault via wikilinks in their `links:` field. The build verifies the
target note exists.
