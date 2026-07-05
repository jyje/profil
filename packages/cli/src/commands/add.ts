// packages/cli/src/commands/add.ts
//
// Adds a resume entry: validates flag values against the schema, then writes
// content/resume/<section>/<slug>.md and runs the static checks right away.
// Non-interactive — missing required values are reported as errors instead
// of prompted for.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import {
  ExperienceSchema,
  ProjectSchema,
  EducationSchema,
  PositionSchema,
} from "@profil/jari";
import { runCheck } from "./check.js";
import { bold, dim, green, red } from "../report.js";

export type AddType = "experience" | "project" | "education" | "position";

export const ADD_TYPES: AddType[] = ["experience", "project", "education", "position"];

const DIR_BY_TYPE: Record<AddType, string> = {
  experience: "experience",
  project: "projects",
  education: "education",
  position: "positions",
};

export interface AddOptions {
  lang?: string;
  slug?: string;
  company?: string;
  role?: string;
  title?: string;
  institution?: string;
  degree?: string;
  start?: string;
  end?: string;
  location?: string;
  positions?: string; // comma-separated: "mlops,backend"
  url?: string;
  headline?: string;
}

export interface BuiltEntry {
  relPath: string; // relative to content/resume
  content: string;
  errors: string[];
}

/** Builds a filename slug — keeps Unicode letters (e.g. Korean), spaces become hyphens */
export function slugify(source: string): string {
  return source
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function placeholderBody(type: AddType, lang: string): string {
  if (type === "position") {
    return lang === "en"
      ? "Describe what this resume view is for."
      : "이 포지션용 이력서 뷰가 무엇을 위한 것인지 설명하세요.";
  }
  return lang === "en"
    ? "Write a one-line summary here.\n\n- Key achievement 1\n- Key achievement 2"
    : "한 줄 요약을 여기에 작성하세요.\n\n- 주요 성과 1\n- 주요 성과 2";
}

/** Assembles flags into frontmatter and validates against the schema. Doesn't write a file. */
export function buildEntry(type: AddType, opts: AddOptions): BuiltEntry {
  const lang = opts.lang ?? "ko";
  const positions = (opts.positions ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  const period =
    opts.start !== undefined
      ? { start: opts.start, ...(opts.end !== undefined ? { end: opts.end } : {}) }
      : undefined;

  let fm: Record<string, unknown>;
  let schema;
  let slugSource: string | undefined;

  switch (type) {
    case "experience":
      fm = {
        type,
        lang,
        company: opts.company,
        role: opts.role,
        period,
        ...(opts.location !== undefined ? { location: opts.location } : {}),
        positions,
      };
      schema = ExperienceSchema;
      slugSource = opts.company;
      break;
    case "project":
      fm = {
        type,
        lang,
        title: opts.title,
        ...(period !== undefined ? { period } : {}),
        ...(opts.role !== undefined ? { role: opts.role } : {}),
        ...(opts.url !== undefined ? { url: opts.url } : {}),
        positions,
      };
      schema = ProjectSchema;
      slugSource = opts.title;
      break;
    case "education":
      fm = {
        type,
        lang,
        institution: opts.institution,
        ...(opts.degree !== undefined ? { degree: opts.degree } : {}),
        period,
      };
      schema = EducationSchema;
      slugSource = opts.institution;
      break;
    case "position":
      fm = {
        type,
        lang,
        slug: opts.slug ?? (opts.title !== undefined ? slugify(opts.title) : undefined),
        title: opts.title,
        ...(opts.headline !== undefined ? { headline: opts.headline } : {}),
      };
      schema = PositionSchema;
      slugSource = opts.title;
      break;
  }

  const errors: string[] = [];
  const result = schema.safeParse(fm);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      errors.push(`--${path.replace("period.", "")} is required or invalid (${path}: ${issue.message})`);
    }
  }

  const slug = opts.slug ?? (slugSource !== undefined ? slugify(slugSource) : "");
  if (slug === "") {
    errors.push("could not derive a slug — pass --slug explicitly");
  }

  if (errors.length > 0) {
    return { relPath: "", content: "", errors };
  }

  // Serialize the validated value (with defaults applied) back to frontmatter
  const yaml = stringifyYaml(result.data ?? fm);
  const content = `---\n${yaml}---\n${placeholderBody(type, lang)}\n`;
  return { relPath: join(DIR_BY_TYPE[type], `${slug}.md`), content, errors: [] };
}

export async function runAdd(
  projectRoot: string,
  type: AddType,
  opts: AddOptions,
): Promise<boolean> {
  console.log(bold(`profil add ${type} — ${projectRoot}`));
  console.log();

  const { relPath, content, errors } = buildEntry(type, opts);
  if (errors.length > 0) {
    console.log(red("could not create the entry:"));
    for (const e of errors) console.log(`    ${e}`);
    return false;
  }

  const absPath = join(projectRoot, "content/resume", relPath);
  if (existsSync(absPath)) {
    console.log(red(`already exists: content/resume/${relPath}`));
    console.log(dim("pass --slug to use a different filename."));
    return false;
  }

  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, content, "utf-8");
  console.log(`${green("✔")} created: content/resume/${relPath}`);
  console.log(dim("   fill in the summary and achievement bullets."));
  console.log();

  return runCheck(projectRoot);
}
