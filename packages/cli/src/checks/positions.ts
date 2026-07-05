// packages/cli/src/checks/positions.ts
//
// 포지션 태그 무결성: 콘텐츠의 positions[]/weight 키와 madang.config.yaml의
// resume.positions가 전부 positions/*.md에 정의된 slug를 가리키는지 검사한다.

import type { ContentIssue, ResumeModel } from "@madang/jari";
import { CONFIG_FILENAME } from "../config.js";

export interface PositionsCheckResult {
  errors: ContentIssue[];
  warnings: ContentIssue[];
}

export function checkPositionsIntegrity(
  model: ResumeModel,
  configPositions: string[],
): PositionsCheckResult {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  const slugs = new Set(model.positions.map((p) => p.data.slug));

  const taggedEntries = [...model.experience, ...model.projects];
  for (const entry of taggedEntries) {
    for (const tag of entry.data.positions) {
      if (!slugs.has(tag)) {
        errors.push({
          file: entry.sourcePath,
          message: `positions 태그 "${tag}"에 해당하는 positions/*.md가 없습니다`,
        });
      }
    }
    for (const key of Object.keys(entry.data.weight ?? {})) {
      if (!slugs.has(key)) {
        errors.push({
          file: entry.sourcePath,
          message: `weight 키 "${key}"에 해당하는 positions/*.md가 없습니다`,
        });
      }
    }
  }

  if (model.skills) {
    for (const group of model.skills.data.groups) {
      for (const tag of group.positions ?? []) {
        if (!slugs.has(tag)) {
          errors.push({
            file: model.skills.sourcePath,
            message: `스킬 그룹 "${group.label}"의 positions 태그 "${tag}"에 해당하는 positions/*.md가 없습니다`,
          });
        }
      }
    }
  }

  for (const pos of configPositions) {
    if (!slugs.has(pos)) {
      errors.push({
        file: CONFIG_FILENAME,
        message: `resume.positions의 "${pos}"에 해당하는 positions/*.md가 없습니다`,
      });
    }
  }
  for (const slug of slugs) {
    if (!configPositions.includes(slug)) {
      warnings.push({
        file: CONFIG_FILENAME,
        message: `positions/*.md에 정의된 "${slug}"가 resume.positions에 없습니다 (빌드에서 제외됨)`,
      });
    }
  }

  return { errors, warnings };
}
