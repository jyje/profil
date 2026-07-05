// packages/cli/src/commands/list.ts
//
// Lists resume entries: assembles the canonical model and prints a summary
// per section.

import { join } from "node:path";
import { loadResumeModel, type ResumeModel } from "@profil/jari";
import { bold, dim, red } from "../report.js";

export const LIST_SECTIONS = [
  "experience",
  "projects",
  "education",
  "positions",
  "skills",
] as const;

export type ListSection = (typeof LIST_SECTIONS)[number];

function formatPeriod(period?: { start: string; end?: string }): string {
  if (!period) return "";
  return `${period.start}~${period.end ?? ""}`;
}

function printSectionList(model: ResumeModel, section: ListSection): void {
  switch (section) {
    case "experience":
      console.log(bold(`experience (${model.experience.length})`));
      for (const e of model.experience) {
        const tags = e.data.positions.length > 0 ? ` [${e.data.positions.join(", ")}]` : "";
        console.log(
          `  ${dim(e.sourcePath)}  ${e.data.company} — ${e.data.role}  ${formatPeriod(e.data.period)}${tags}`,
        );
      }
      break;
    case "projects":
      console.log(bold(`projects (${model.projects.length})`));
      for (const p of model.projects) {
        const tags = p.data.positions.length > 0 ? ` [${p.data.positions.join(", ")}]` : "";
        console.log(
          `  ${dim(p.sourcePath)}  ${p.data.title}  ${formatPeriod(p.data.period)}${tags}`,
        );
      }
      break;
    case "education":
      console.log(bold(`education (${model.education.length})`));
      for (const e of model.education) {
        console.log(
          `  ${dim(e.sourcePath)}  ${e.data.institution}${e.data.degree ? ` — ${e.data.degree}` : ""}  ${formatPeriod(e.data.period)}`,
        );
      }
      break;
    case "positions":
      console.log(bold(`positions (${model.positions.length})`));
      for (const p of model.positions) {
        console.log(`  ${dim(p.sourcePath)}  ${p.data.slug} — ${p.data.title}`);
      }
      break;
    case "skills": {
      const groups = model.skills?.data.groups ?? [];
      console.log(bold(`skills (${groups.length} groups)`));
      for (const g of groups) {
        const tags = g.positions && g.positions.length > 0 ? ` [${g.positions.join(", ")}]` : "";
        console.log(`  ${g.label}${tags}: ${g.items.join(", ")}`);
      }
      break;
    }
  }
}

export async function runList(projectRoot: string, section?: string): Promise<boolean> {
  if (section !== undefined && !LIST_SECTIONS.includes(section as ListSection)) {
    console.error(red(`unknown section: ${section} (valid: ${LIST_SECTIONS.join(", ")})`));
    return false;
  }

  const { model, errors } = await loadResumeModel(join(projectRoot, "content/resume"));
  if (!model) {
    console.error(red("failed to load the content model:"));
    for (const e of errors) console.error(`    ${dim(e.file)}  ${e.message}`);
    return false;
  }

  console.log(bold(`${model.basics.data.name}`) + dim(` — ${projectRoot}`));
  console.log();

  const sections = section !== undefined ? [section as ListSection] : [...LIST_SECTIONS];
  for (const s of sections) {
    printSectionList(model, s);
    console.log();
  }

  if (errors.length > 0) {
    console.log(red(`⚠ ${errors.length} schema error(s) found — run profil check for details`));
  }
  return true;
}
