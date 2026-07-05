// packages/cli/src/report.ts
//
// 검사 결과 출력 헬퍼. 색상은 TTY이고 NO_COLOR가 없을 때만 사용한다.

import type { ContentIssue } from "@madang/jari";

const useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;

const paint = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const green = paint("32");
export const red = paint("31");
export const yellow = paint("33");
export const dim = paint("2");
export const bold = paint("1");

/** 섹션 하나의 검사 결과를 출력한다. 오류가 있으면 목록을 들여쓰기로 표시. */
export function printSection(title: string, issues: ContentIssue[], detail?: string): void {
  if (issues.length === 0) {
    console.log(`${green("✔")} ${title}${detail ? dim(` — ${detail}`) : ""}`);
  } else {
    console.log(`${red("✘")} ${title} ${red(`(${issues.length}건)`)}`);
    for (const issue of issues) {
      console.log(`    ${dim(issue.file)}  ${issue.message}`);
    }
  }
}

export function printWarnings(warnings: ContentIssue[]): void {
  for (const w of warnings) {
    console.log(`${yellow("⚠")} ${dim(w.file)}  ${w.message}`);
  }
}
