# content/portfolio/ — portfolio entries

Migration target for jyje/profile's `_data/portfolio-*.yml`. Follows the
one-file-per-entry rule (the schema will be defined between M1-M2, either by
extending `ProjectSchema` or as a separate `PortfolioSchema` in
`packages/jari/src/schema.ts`).

Difference from `content/resume/projects/*.md`: resume/projects are short
entries shown on the resume, while portfolio entries are detailed ones shown
on the web portfolio tab (images, longer descriptions). To reference the same
project from both, link them together via `links:`.
