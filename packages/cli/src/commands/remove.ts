// packages/cli/src/commands/remove.ts
//
// 이력 항목 삭제: content/resume 아래 파일만 지울 수 있고,
// 삭제 후 정적 검사를 돌려 깨진 참조(위키링크 등)를 바로 알려준다.

import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { runCheck } from "./check.js";
import { bold, dim, green, red } from "../report.js";

export async function runRemove(projectRoot: string, relPath: string): Promise<boolean> {
  console.log(bold(`madang remove — ${projectRoot}`));
  console.log();

  const resumeRoot = resolve(projectRoot, "content/resume");
  const target = resolve(resumeRoot, relPath);

  if (!target.startsWith(resumeRoot + sep)) {
    console.error(red("content/resume 밖의 경로는 삭제할 수 없습니다."));
    return false;
  }
  if (!existsSync(target)) {
    console.error(red(`파일이 없습니다: content/resume/${relPath}`));
    console.error(dim("경로는 content/resume 기준입니다. 예: experience/acme.md"));
    return false;
  }

  await rm(target);
  console.log(`${green("✔")} 삭제: ${join("content/resume", relPath)}`);
  console.log();

  return runCheck(projectRoot);
}
