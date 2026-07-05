// packages/cli/src/checks/wikilinks.ts
//
// 위키링크 무결성: frontmatter links[]와 본문의 [[...]]가 content/ 아래
// 실제 파일로 해석되는지 검사한다.
//
// 해석 규칙 (content/notes/README.md의 퍼머링크 규약과 일치해야 함):
//   [[target]] -> content/{resume,notes,portfolio}/<target>.md
//              또는 content/<target>.md, .../<target>/index.md 순서로 탐색

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

/** target이 content/ 아래 파일로 해석되면 true */
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
  /** 검사한 링크 총 개수 */
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
          message: `위키링크 대상이 없습니다: [[${target}]]`,
        });
      }
    }
  }

  return { errors, count };
}
