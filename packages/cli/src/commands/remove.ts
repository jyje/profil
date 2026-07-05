// packages/cli/src/commands/remove.ts
//
// Removes a resume entry: only files under content/resume can be deleted,
// and the static checks run right after to surface any broken references
// (e.g. wikilinks) immediately.

import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { runCheck } from "./check.js";
import { bold, dim, green, red } from "../report.js";

export async function runRemove(projectRoot: string, relPath: string): Promise<boolean> {
  console.log(bold(`profil remove — ${projectRoot}`));
  console.log();

  const resumeRoot = resolve(projectRoot, "content/resume");
  const target = resolve(resumeRoot, relPath);

  if (!target.startsWith(resumeRoot + sep)) {
    console.error(red("cannot delete a path outside content/resume."));
    return false;
  }
  if (!existsSync(target)) {
    console.error(red(`file not found: content/resume/${relPath}`));
    console.error(dim("the path is relative to content/resume, e.g. experience/acme.md"));
    return false;
  }

  await rm(target);
  console.log(`${green("✔")} removed: ${join("content/resume", relPath)}`);
  console.log();

  return runCheck(projectRoot);
}
