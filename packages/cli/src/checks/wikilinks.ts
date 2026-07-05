// packages/cli/src/checks/wikilinks.ts
//
// Wikilink integrity: checks that frontmatter links[] and inline [[...]] in
// the body resolve to an actual file under content/.
//
// Resolution rule (must match the permalink convention in
// content/notes/README.md):
//   [[target]] -> content/{resume,notes,portfolio}/<target>.md
//              or content/<target>.md, .../<target>/index.md, in that order

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ContentIssue, ResumeModel, ResumeEntry } from "@profil/jari";

const SEARCH_ROOTS = ["resume", "notes", "portfolio", "."];

const WIKILINK_PATTERN = /\[\[([^\]]+)\]\]/g;

/** "[[target|alias#heading]]" -> "target" */
export function wikilinkTarget(link: string): string {
  const inner = link.replace(/^\[\[/, "").replace(/\]\]$/, "");
  return inner.split("|")[0].split("#")[0].trim();
}

/** True if target resolves to a file under content/ */
export function resolveWikilink(contentRoot: string, target: string): boolean {
  if (target === "") return false;
  for (const root of SEARCH_ROOTS) {
    const base = join(contentRoot, root, target);
    if (existsSync(`${base}.md`) || existsSync(join(base, "index.md")) || existsSync(base)) {
      return true;
    }
  }
  return false;
}

function collectLinks(entry: ResumeEntry<{ links?: string[] }>): string[] {
  const links = [...(entry.data.links ?? [])];
  for (const match of entry.body.matchAll(WIKILINK_PATTERN)) {
    links.push(match[0]);
  }
  return links;
}

export interface WikilinksCheckResult {
  errors: ContentIssue[];
  /** Total number of links checked */
  count: number;
}

export function checkWikilinks(model: ResumeModel, contentRoot: string): WikilinksCheckResult {
  const errors: ContentIssue[] = [];
  let count = 0;

  const entries: ResumeEntry<{ links?: string[] }>[] = [
    model.basics,
    ...model.experience,
    ...model.projects,
    ...model.education,
    ...(model.skills ? [model.skills] : []),
    ...model.positions,
  ];

  for (const entry of entries) {
    for (const link of collectLinks(entry)) {
      count += 1;
      const target = wikilinkTarget(link);
      if (!resolveWikilink(contentRoot, target)) {
        errors.push({
          file: `resume/${entry.sourcePath}`,
          message: `wikilink target not found: [[${target}]]`,
        });
      }
    }
  }

  return { errors, count };
}
