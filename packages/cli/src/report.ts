// packages/cli/src/report.ts
//
// Check-result printing helpers. Color is only used on a TTY without NO_COLOR.

import type { ContentIssue } from "@profil/jari";

const useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;

const paint = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const green = paint("32");
export const red = paint("31");
export const yellow = paint("33");
export const dim = paint("2");
export const bold = paint("1");

/** Prints one section's check result. Lists issues indented if any. */
export function printSection(title: string, issues: ContentIssue[], detail?: string): void {
  if (issues.length === 0) {
    console.log(`${green("✔")} ${title}${detail ? dim(` — ${detail}`) : ""}`);
  } else {
    console.log(`${red("✘")} ${title} ${red(`(${issues.length})`)}`);
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
