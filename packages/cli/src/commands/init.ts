// packages/cli/src/commands/init.ts
//
// Full initialization: scaffolds templates/ into the target directory.
//
// Safety rules:
//   - Refuses by default if managed files already exist, requiring --force
//     (non-interactive)
//   - --force is only allowed to delete profil.config.yaml, content/resume/,
//     and dist/. content/notes/ (the Obsidian vault) and content/portfolio/
//     may be user data, so they're only created if missing, never overwritten.

import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../paths.js";
import { CONFIG_FILENAME } from "../config.js";
import { runCheck } from "./check.js";
import { bold, dim, green, red, yellow } from "../report.js";

/** Paths deleted and regenerated on --force (relative to the project root) */
const MANAGED_PATHS = [CONFIG_FILENAME, "content/resume", "dist"];

/** Paths only created if missing */
const CREATE_ONLY_PATHS = ["content/notes", "content/portfolio"];

export async function runInit(targetRoot: string, force: boolean): Promise<boolean> {
  console.log(bold(`profil init — ${targetRoot}`));
  console.log();

  // So --home (and similar) can initialize a directory that doesn't exist yet
  await mkdir(targetRoot, { recursive: true });

  const existing = MANAGED_PATHS.filter((p) => existsSync(join(targetRoot, p)));
  if (existing.length > 0 && !force) {
    console.log(red("init aborted — the following paths already exist:"));
    for (const p of existing) console.log(`    ${p}`);
    console.log();
    console.log(`Use ${bold("profil init --force")} to overwrite.`);
    console.log(dim(`(--force only regenerates the paths above. ${CREATE_ONLY_PATHS.join(", ")} are left untouched)`));
    return false;
  }

  if (existing.length > 0) {
    console.log(yellow("--force: deleting and regenerating the following paths from the template:"));
    for (const p of existing) {
      console.log(`    ${p}`);
      await rm(join(targetRoot, p), { recursive: true, force: true });
    }
    console.log();
  }

  // Copy the template
  await cp(join(TEMPLATES_DIR, CONFIG_FILENAME), join(targetRoot, CONFIG_FILENAME));
  await cp(join(TEMPLATES_DIR, "content/resume"), join(targetRoot, "content/resume"), {
    recursive: true,
  });
  console.log(`${green("✔")} scaffolded ${CONFIG_FILENAME}, content/resume`);

  for (const p of CREATE_ONLY_PATHS) {
    const dest = join(targetRoot, p);
    if (existsSync(dest)) {
      console.log(`${dim("·")} ${p} already exists — skipped`);
    } else {
      await cp(join(TEMPLATES_DIR, p), dest, { recursive: true });
      console.log(`${green("✔")} created ${p}`);
    }
  }

  // Run the static checks right after init to validate the scaffold itself
  console.log();
  return runCheck(targetRoot);
}
