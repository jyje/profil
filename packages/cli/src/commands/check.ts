// packages/cli/src/commands/check.ts
//
// Static checks: config schema -> content schema -> position integrity ->
// wikilink integrity. All errors are collected and reported together;
// returns false if there are any.

import { join } from "node:path";
import { loadResumeModel } from "@profil/jari";
import { loadConfig, CONFIG_FILENAME } from "../config.js";
import { checkPositionsIntegrity } from "../checks/positions.js";
import { checkWikilinks } from "../checks/wikilinks.js";
import { printSection, printWarnings, bold, red, green } from "../report.js";

export async function runCheck(projectRoot: string): Promise<boolean> {
  console.log(bold(`profil check — ${projectRoot}`));
  console.log();

  let errorCount = 0;

  // 1. Config
  const { config, errors: configErrors } = await loadConfig(projectRoot);
  printSection(`${CONFIG_FILENAME} schema`, configErrors);
  errorCount += configErrors.length;

  // 2. Content schema
  const contentRoot = join(projectRoot, "content");
  const { model, errors: contentErrors } = await loadResumeModel(join(contentRoot, "resume"));
  const fileCount = model
    ? 2 + // basics + skills slots
      model.experience.length +
      model.projects.length +
      model.education.length +
      model.positions.length
    : 0;
  printSection("content/resume schema", contentErrors, model ? `${fileCount} entries` : undefined);
  errorCount += contentErrors.length;

  // 3-4. Integrity checks only make sense once the model is assembled
  if (model) {
    const positionsResult = checkPositionsIntegrity(model, config?.resume.positions ?? []);
    printSection(
      "position tag integrity",
      positionsResult.errors,
      `${model.positions.length} positions`,
    );
    printWarnings(positionsResult.warnings);
    errorCount += positionsResult.errors.length;

    const wikilinksResult = checkWikilinks(model, contentRoot);
    printSection("wikilink integrity", wikilinksResult.errors, `${wikilinksResult.count} links`);
    errorCount += wikilinksResult.errors.length;
  } else {
    console.log(red("✘"), "skipping position/wikilink checks (content model failed to load)");
  }

  console.log();
  if (errorCount > 0) {
    console.log(red(`check failed — ${errorCount} error(s)`));
    return false;
  }
  console.log(green("all static checks passed"));
  return true;
}
