// packages/cli/src/commands/check.ts
//
// 정적 검사: 설정 스키마 → 콘텐츠 스키마 → 포지션 무결성 → 위키링크 무결성.
// 오류를 전부 수집해 한 번에 보고하고, 하나라도 있으면 false를 반환한다.

import { join } from "node:path";
import { loadResumeModel } from "@madang/jari";
import { loadConfig, CONFIG_FILENAME } from "../config.js";
import { checkPositionsIntegrity } from "../checks/positions.js";
import { checkWikilinks } from "../checks/wikilinks.js";
import { printSection, printWarnings, bold, red, green } from "../report.js";

export async function runCheck(projectRoot: string): Promise<boolean> {
  console.log(bold(`madang check — ${projectRoot}`));
  console.log();

  let errorCount = 0;

  // 1. 설정
  const { config, errors: configErrors } = await loadConfig(projectRoot);
  printSection(`${CONFIG_FILENAME} 스키마`, configErrors);
  errorCount += configErrors.length;

  // 2. 콘텐츠 스키마
  const contentRoot = join(projectRoot, "content");
  const { model, errors: contentErrors } = await loadResumeModel(join(contentRoot, "resume"));
  const fileCount = model
    ? 2 + // basics + skills 자리
      model.experience.length +
      model.projects.length +
      model.education.length +
      model.positions.length
    : 0;
  printSection("content/resume 스키마", contentErrors, model ? `${fileCount}개 항목` : undefined);
  errorCount += contentErrors.length;

  // 3–4. 모델이 조립됐을 때만 무결성 검사 가능
  if (model) {
    const positionsResult = checkPositionsIntegrity(model, config?.resume.positions ?? []);
    printSection(
      "포지션 태그 무결성",
      positionsResult.errors,
      `${model.positions.length}개 포지션`,
    );
    printWarnings(positionsResult.warnings);
    errorCount += positionsResult.errors.length;

    const wikilinksResult = checkWikilinks(model, contentRoot);
    printSection("위키링크 무결성", wikilinksResult.errors, `${wikilinksResult.count}개 링크`);
    errorCount += wikilinksResult.errors.length;
  } else {
    console.log(red("✘"), "포지션/위키링크 검사 건너뜀 (콘텐츠 모델 조립 실패)");
  }

  console.log();
  if (errorCount > 0) {
    console.log(red(`검사 실패 — 오류 ${errorCount}건`));
    return false;
  }
  console.log(green("모든 정적 검사 통과"));
  return true;
}
