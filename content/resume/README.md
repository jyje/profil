# content/resume/ authoring convention

Every file in this directory must have frontmatter that follows the zod
schema in `packages/jari/src/schema.ts`. One file per entry is the rule.

## Mapping rule (md <-> data)

- frontmatter -> structured fields (company, period, tags, etc.) — a direct 1:1 mapping
- the body's first paragraph -> `summary`
- the body's bullet list (`- ` or `* `) -> `highlights[]`

Following this rule makes md files losslessly convertible to and from YAML.
Free-form prose, nested structures, and JSX/MDX components are not used in
this directory — the PDF/DOCX renderer can't understand them.

## Language

Different-language versions of the same entry are distinguished by a
filename suffix: `maxst.md` (default, ko) / `maxst.en.md`. The `lang`
frontmatter field is required.

## Position tags

Reference a slug defined in `content/resume/positions/*.md`, e.g.
`positions: [mlops, backend]`. To support a new position, add a new file
under `positions/` — existing experience/project files don't need to change
(just add the tag to the relevant entries).

## Linking to the knowledge base / portfolio

Reference an entry in `content/notes/` or `content/portfolio/` via a
wikilink, e.g. `links: ["[[projects/cluster]]"]`. The build verifies the
target exists.
