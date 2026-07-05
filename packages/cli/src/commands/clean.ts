// packages/cli/src/commands/clean.ts
//
// Removes build outputs. Default is the root dist/ and packages/*/dist;
// --deep also removes node_modules.

import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { bold, dim, green } from "../report.js";

export async function runClean(projectRoot: string, deep: boolean): Promise<boolean> {
  console.log(bold(`profil clean — ${projectRoot}${deep ? " (--deep)" : ""}`));

  const targets = [join(projectRoot, "dist")];

  const packagesDir = join(projectRoot, "packages");
  if (existsSync(packagesDir)) {
    for (const pkg of await readdir(packagesDir)) {
      targets.push(join(packagesDir, pkg, "dist"));
      targets.push(join(packagesDir, pkg, "tsconfig.tsbuildinfo"));
    }
  }

  if (deep) {
    targets.push(join(projectRoot, "node_modules"));
  }

  for (const target of targets) {
    if (!existsSync(target)) continue;
    await rm(target, { recursive: true, force: true });
    console.log(`${green("✔")} removed: ${target.slice(projectRoot.length + 1)}`);
  }

  if (deep) {
    console.log(dim("node_modules removed. Run `npm install` to reinstall."));
  }
  return true;
}
