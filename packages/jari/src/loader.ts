// packages/jari/src/loader.ts
//
// content/resume/ 디렉토리 전체를 스캔해 canonical ResumeModel로 조립한다.
// 오류는 throw하지 않고 전부 수집해서 반환한다 — CLI가 한 번에 보고할 수 있도록.
//
// 현재 범위(M1): lang 접미사(*.en.md)는 별도 항목으로 읽는다. 언어별 병합/폴백은
// 포지션 변형과 함께 M3에서 다룬다.

import matter from "gray-matter";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { z } from "zod";
import {
  BasicsSchema,
  ExperienceSchema,
  ProjectSchema,
  EducationSchema,
  SkillsSchema,
  PositionSchema,
  type Basics,
  type Experience,
  type Project,
  type Education,
  type Skills,
  type Position,
} from "./schema.js";
import { extractBody } from "./parser.js";

/** 파일 하나에서 나온 검증/파싱 문제 */
export interface ContentIssue {
  file: string; // contentDir 기준 상대 경로
  message: string;
}

/** md 파일 하나 = frontmatter(스키마 검증됨) + 본문 추출 결과 */
export interface ResumeEntry<T> {
  data: T;
  summary: string;
  highlights: string[];
  body: string;
  sourcePath: string; // contentDir 기준 상대 경로
}

export interface ResumeModel {
  basics: ResumeEntry<Basics>;
  experience: ResumeEntry<Experience>[];
  projects: ResumeEntry<Project>[];
  education: ResumeEntry<Education>[];
  skills: ResumeEntry<Skills> | null;
  positions: ResumeEntry<Position>[];
}

export interface LoadResumeResult {
  /** basics가 유효하지 않으면 null (나머지 오류는 그래도 전부 수집됨) */
  model: ResumeModel | null;
  errors: ContentIssue[];
}

async function parseEntry<T>(
  // Input 타입(기본값 적용 전)이 아니라 Output 타입으로 T가 추론되도록 고정
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  filePath: string,
  contentDir: string,
  errors: ContentIssue[],
): Promise<ResumeEntry<T> | null> {
  const rel = relative(contentDir, filePath);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (e) {
    errors.push({ file: rel, message: `파일 읽기 실패: ${(e as Error).message}` });
    return null;
  }

  let data: Record<string, unknown>;
  let content: string;
  try {
    ({ data, content } = matter(raw));
  } catch (e) {
    errors.push({ file: rel, message: `frontmatter 파싱 실패: ${(e as Error).message}` });
    return null;
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      errors.push({ file: rel, message: `${path}: ${issue.message}` });
    }
    return null;
  }

  const { summary, highlights } = extractBody(content);
  return { data: result.data, summary, highlights, body: content, sourcePath: rel };
}

/** 디렉토리의 md 파일 목록 (README.md 제외, 이름순 정렬) */
async function listMarkdown(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .sort()
    .map((f) => join(dir, f));
}

async function loadDir<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  dir: string,
  contentDir: string,
  errors: ContentIssue[],
): Promise<ResumeEntry<T>[]> {
  const entries: ResumeEntry<T>[] = [];
  for (const file of await listMarkdown(dir)) {
    const entry = await parseEntry(schema, file, contentDir, errors);
    if (entry) entries.push(entry);
  }
  return entries;
}

/**
 * content/resume 디렉토리 전체를 스캔해 ResumeModel을 조립한다.
 *
 * - basics.md는 필수, skills.md는 선택
 * - experience/, projects/, education/, positions/ 하위 md를 각 스키마로 검증
 * - 포지션 slug 중복(같은 lang 내)을 오류로 수집
 */
export async function loadResumeModel(contentDir: string): Promise<LoadResumeResult> {
  const errors: ContentIssue[] = [];

  if (!existsSync(contentDir)) {
    return {
      model: null,
      errors: [{ file: ".", message: `콘텐츠 디렉토리가 없습니다: ${contentDir}` }],
    };
  }

  const basicsPath = join(contentDir, "basics.md");
  let basics: ResumeEntry<Basics> | null = null;
  if (existsSync(basicsPath)) {
    basics = await parseEntry(BasicsSchema, basicsPath, contentDir, errors);
  } else {
    errors.push({ file: "basics.md", message: "필수 파일이 없습니다" });
  }

  const skillsPath = join(contentDir, "skills.md");
  const skills = existsSync(skillsPath)
    ? await parseEntry(SkillsSchema, skillsPath, contentDir, errors)
    : null;

  const [experience, projects, education, positions] = await Promise.all([
    loadDir(ExperienceSchema, join(contentDir, "experience"), contentDir, errors),
    loadDir(ProjectSchema, join(contentDir, "projects"), contentDir, errors),
    loadDir(EducationSchema, join(contentDir, "education"), contentDir, errors),
    loadDir(PositionSchema, join(contentDir, "positions"), contentDir, errors),
  ]);

  const seenSlugs = new Map<string, string>(); // "slug:lang" -> sourcePath
  for (const pos of positions) {
    const key = `${pos.data.slug}:${pos.data.lang}`;
    const prev = seenSlugs.get(key);
    if (prev) {
      errors.push({
        file: pos.sourcePath,
        message: `포지션 slug 중복: "${pos.data.slug}" (lang=${pos.data.lang}, 먼저 정의된 곳: ${prev})`,
      });
    } else {
      seenSlugs.set(key, pos.sourcePath);
    }
  }

  if (!basics) {
    return { model: null, errors };
  }

  return {
    model: { basics, experience, projects, education, skills, positions },
    errors,
  };
}
