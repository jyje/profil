// packages/cli/src/commands/build.ts
//
// Builds the per-position resume outputs: assembles a filtered/sorted view
// for each position x language and renders it to Markdown and/or HTML under
// dist/. PDF and DOCX are M2 (Playwright/Pandoc) — requesting them warns
// and skips rather than failing, so a config listing all four formats still
// builds what it can today.
//
// Static checks run first: broken content never produces output.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  loadResumeModel,
  loadDesignTokens,
  assembleResume,
  renderMarkdown,
  renderHtml,
} from "@profil/jari";
import { loadConfig } from "../config.js";
import { runCheck } from "./check.js";
import { slugify } from "./add.js";
import { bold, dim, green, red, yellow, printWarnings } from "../report.js";

const SUPPORTED_FORMATS = ["md", "html"] as const;
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];
const M2_FORMATS = ["pdf", "docx"];

export interface BuildOptions {
  position?: string;
  lang?: string;
  format?: string; // comma-separated
  out?: string;
}

/** Splits requested formats into buildable ones, warning on M2 formats. */
function resolveFormats(requested: string[]): { formats: SupportedFormat[]; ok: boolean } {
  const formats: SupportedFormat[] = [];
  for (const f of requested) {
    if ((SUPPORTED_FORMATS as readonly string[]).includes(f)) {
      formats.push(f as SupportedFormat);
    } else if (M2_FORMATS.includes(f)) {
      console.log(yellow(`⚠ format "${f}" is not implemented until M2 — skipping`));
    } else {
      console.error(red(`unknown format: "${f}" (supported: ${SUPPORTED_FORMATS.join(", ")})`));
      return { formats: [], ok: false };
    }
  }
  if (formats.length === 0) {
    console.error(red("no buildable format requested (supported today: md, html)"));
    return { formats: [], ok: false };
  }
  return { formats, ok: true };
}

export async function runBuild(projectRoot: string, opts: BuildOptions): Promise<boolean> {
  console.log(bold(`profil build — ${projectRoot}`));
  console.log();

  // 1. Config + content must be valid before anything is written
  const { config, errors: configErrors } = await loadConfig(projectRoot);
  if (!config) {
    for (const e of configErrors) console.error(red(`${e.file}  ${e.message}`));
    return false;
  }
  if (!(await runCheck(projectRoot))) return false;
  console.log();

  const { model } = await loadResumeModel(join(projectRoot, "content/resume"));
  if (!model) return false; // unreachable after a passing check, but keeps types honest

  // 2. Resolve the build matrix
  const positions = opts.position ? [opts.position] : config.resume.positions;
  if (opts.position && !model.positions.some((p) => p.data.slug === opts.position)) {
    console.error(red(`unknown position: "${opts.position}"`));
    console.error(dim(`defined positions: ${model.positions.map((p) => p.data.slug).join(", ")}`));
    return false;
  }

  // Languages the content actually has (M1: a single basics.md decides).
  // Config may declare more languages than the content provides — those are
  // skipped silently unless requested explicitly.
  const availableLangs: string[] = [model.basics.data.lang];
  let langs: string[];
  if (opts.lang) {
    if (!availableLangs.includes(opts.lang)) {
      console.error(red(`no content exists for lang "${opts.lang}" (available: ${availableLangs.join(", ")})`));
      return false;
    }
    langs = [opts.lang];
  } else {
    langs = availableLangs;
  }

  const requested = opts.format
    ? opts.format.split(",").map((f) => f.trim()).filter((f) => f !== "")
    : config.resume.formats;
  const { formats, ok } = resolveFormats(requested);
  if (!ok) return false;

  // 3. Assemble and render
  const { tokens, warnings: tokenWarnings } = loadDesignTokens(projectRoot);
  printWarnings(tokenWarnings);

  const outDir = opts.out ? join(projectRoot, opts.out) : join(projectRoot, "dist");
  await mkdir(outDir, { recursive: true });

  const nameSlug = slugify(model.basics.data.name);
  const written: string[] = [];

  for (const position of positions) {
    for (const lang of langs) {
      const { assembled, errors } = assembleResume(model, { position, lang });
      if (!assembled) {
        for (const e of errors) console.error(red(`${e.file}  ${e.message}`));
        return false;
      }
      for (const format of formats) {
        const content =
          format === "md" ? renderMarkdown(assembled) : renderHtml(assembled, tokens);
        const filename = `${nameSlug}-${position}-${lang}.${format}`;
        await writeFile(join(outDir, filename), content, "utf-8");
        written.push(filename);
      }
    }
  }

  console.log(bold(`built ${written.length} file(s) -> ${outDir}`));
  for (const f of written) console.log(`${green("✔")} ${f}`);
  return true;
}
