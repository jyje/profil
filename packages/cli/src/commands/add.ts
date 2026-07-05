// packages/cli/src/commands/add.ts
//
// 이력 항목 추가: 플래그로 받은 값을 스키마로 검증한 뒤
// content/resume/<섹션>/<slug>.md 를 생성하고, 곧바로 정적 검사를 돌린다.
// 비대화식 — 필수 값이 빠지면 프롬프트 대신 오류로 안내한다.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import {
  ExperienceSchema,
  ProjectSchema,
  EducationSchema,
  PositionSchema,
} from "@madang/jari";
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
  positions?: string; // 쉼표 구분: "mlops,backend"
  url?: string;
  headline?: string;
}

export interface BuiltEntry {
  relPath: string; // content/resume 기준
  content: string;
  errors: string[];
}

/** 파일명으로 쓸 slug 생성 — 한글 등 유니코드 문자 유지, 공백은 하이픈 */
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

/** 플래그를 frontmatter로 조립하고 스키마로 검증한다. 파일은 쓰지 않는다. */
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
      errors.push(`--${path.replace("period.", "")} 값이 필요하거나 잘못됨 (${path}: ${issue.message})`);
    }
  }

  const slug = opts.slug ?? (slugSource !== undefined ? slugify(slugSource) : "");
  if (slug === "") {
    errors.push("slug를 만들 수 없습니다 — --slug 를 지정하세요");
  }

  if (errors.length > 0) {
    return { relPath: "", content: "", errors };
  }

  // 검증된 값(기본값 적용됨)으로 frontmatter를 직렬화
  const yaml = stringifyYaml(result.data ?? fm);
  const content = `---\n${yaml}---\n${placeholderBody(type, lang)}\n`;
  return { relPath: join(DIR_BY_TYPE[type], `${slug}.md`), content, errors: [] };
}

export async function runAdd(
  projectRoot: string,
  type: AddType,
  opts: AddOptions,
): Promise<boolean> {
  console.log(bold(`madang add ${type} — ${projectRoot}`));
  console.log();

  const { relPath, content, errors } = buildEntry(type, opts);
  if (errors.length > 0) {
    console.log(red("항목을 만들 수 없습니다:"));
    for (const e of errors) console.log(`    ${e}`);
    return false;
  }

  const absPath = join(projectRoot, "content/resume", relPath);
  if (existsSync(absPath)) {
    console.log(red(`이미 존재합니다: content/resume/${relPath}`));
    console.log(dim("다른 파일명을 쓰려면 --slug 를 지정하세요."));
    return false;
  }

  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, content, "utf-8");
  console.log(`${green("✔")} 생성: content/resume/${relPath}`);
  console.log(dim("   요약과 성과 불릿을 직접 채워 넣으세요."));
  console.log();

  return runCheck(projectRoot);
}
