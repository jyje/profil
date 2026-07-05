// packages/cli/src/commands/clean.ts
//
// 산출물 정리. 기본은 루트 dist/와 packages/*/dist, --deep은 node_modules까지.

import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { bold, dim, green } from "../report.js";

export async function runClean(projectRoot: string, deep: boolean): Promise<boolean> {
  console.log(bold(`madang clean — ${projectRoot}${deep ? " (--deep)" : ""}`));

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
    console.log(`${green("✔")} 삭제: ${target.slice(projectRoot.length + 1)}`);
  }

  if (deep) {
    console.log(dim("node_modules를 삭제했습니다. `npm install`로 다시 설치하세요."));
  }
  return true;
}
