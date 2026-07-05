// packages/cli/src/checks/positions.ts
//
// Position tag integrity: checks that every positions[]/weight key in content
// and profil.config.yaml's resume.positions all point at a slug defined in
// positions/*.md.

import type { ContentIssue, ResumeModel } from "@profil/jari";
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
          message: `no positions/*.md defines the tag "${tag}"`,
        });
      }
    }
    for (const key of Object.keys(entry.data.weight ?? {})) {
      if (!slugs.has(key)) {
        errors.push({
          file: entry.sourcePath,
          message: `no positions/*.md defines the weight key "${key}"`,
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
            message: `skill group "${group.label}": no positions/*.md defines the tag "${tag}"`,
          });
        }
      }
    }
  }

  for (const pos of configPositions) {
    if (!slugs.has(pos)) {
      errors.push({
        file: CONFIG_FILENAME,
        message: `no positions/*.md defines resume.positions entry "${pos}"`,
      });
    }
  }
  for (const slug of slugs) {
    if (!configPositions.includes(slug)) {
      warnings.push({
        file: CONFIG_FILENAME,
        message: `"${slug}" is defined in positions/*.md but missing from resume.positions (excluded from the build)`,
      });
    }
  }

  return { errors, warnings };
}
