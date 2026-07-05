// packages/cli/src/commands/init.ts
//
// 완전 초기화: templates/ 를 대상 디렉토리에 스캐폴드한다.
//
// 안전 규칙:
//   - 기존 파일이 있으면 기본적으로 거부하고 --force를 요구한다 (비대화식)
//   - --force가 지워도 되는 범위는 madang.config.yaml, content/resume/, dist/ 뿐이다.
//     content/notes/(Obsidian vault)와 content/portfolio/는 사용자 데이터일 수 있으므로
//     없을 때만 생성하고 절대 덮어쓰지 않는다.

import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../paths.js";
import { CONFIG_FILENAME } from "../config.js";
import { runCheck } from "./check.js";
import { bold, dim, green, red, yellow } from "../report.js";

/** --force 시 삭제 후 재생성되는 경로 (프로젝트 루트 기준) */
const MANAGED_PATHS = [CONFIG_FILENAME, "content/resume", "dist"];

/** 없을 때만 생성되는 경로 */
const CREATE_ONLY_PATHS = ["content/notes", "content/portfolio"];

export async function runInit(targetRoot: string, force: boolean): Promise<boolean> {
  console.log(bold(`madang init — ${targetRoot}`));
  console.log();

  const existing = MANAGED_PATHS.filter((p) => existsSync(join(targetRoot, p)));
  if (existing.length > 0 && !force) {
    console.log(red("초기화 중단 — 이미 존재하는 경로가 있습니다:"));
    for (const p of existing) console.log(`    ${p}`);
    console.log();
    console.log(`덮어쓰려면 ${bold("madang init --force")} 를 사용하세요.`);
    console.log(dim(`(--force는 위 경로만 재생성합니다. ${CREATE_ONLY_PATHS.join(", ")}는 건드리지 않습니다)`));
    return false;
  }

  if (existing.length > 0) {
    console.log(yellow("--force: 다음 경로를 삭제하고 템플릿으로 재생성합니다:"));
    for (const p of existing) {
      console.log(`    ${p}`);
      await rm(join(targetRoot, p), { recursive: true, force: true });
    }
    console.log();
  }

  // 템플릿 복사
  await cp(join(TEMPLATES_DIR, CONFIG_FILENAME), join(targetRoot, CONFIG_FILENAME));
  await cp(join(TEMPLATES_DIR, "content/resume"), join(targetRoot, "content/resume"), {
    recursive: true,
  });
  console.log(`${green("✔")} ${CONFIG_FILENAME}, content/resume 스캐폴드 완료`);

  for (const p of CREATE_ONLY_PATHS) {
    const dest = join(targetRoot, p);
    if (existsSync(dest)) {
      console.log(`${dim("·")} ${p} 이미 존재 — 건너뜀`);
    } else {
      await cp(join(TEMPLATES_DIR, p), dest, { recursive: true });
      console.log(`${green("✔")} ${p} 생성`);
    }
  }

  // 초기화 직후 정적 검사로 스캐폴드 자체를 검증한다
  console.log();
  return runCheck(targetRoot);
}
