// packages/jari/src/parser.ts
//
// M1 구현 대상: content/resume/**/*.md 를 읽어 canonical model로 변환한다.
// frontmatter -> zod 스키마 검증, 본문 -> summary/highlights[] 추출.
//
// 설계 규칙 (README 참고):
//   - frontmatter는 그대로 구조 필드로 매핑
//   - 본문 첫 문단 -> summary
//   - 본문 불릿 리스트 -> highlights[]
//   - 이 매핑은 역방향(model -> md 생성)도 무손실이어야 한다 (round-trip 테스트 필수)

import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import {
  BasicsSchema,
  ExperienceSchema,
  ProjectSchema,
  EducationSchema,
  SkillsSchema,
  PositionSchema,
} from "./schema.js";

const SCHEMA_BY_TYPE = {
  basics: BasicsSchema,
  experience: ExperienceSchema,
  project: ProjectSchema,
  education: EducationSchema,
  skills: SkillsSchema,
  position: PositionSchema,
} as const;

export interface ParsedContent {
  frontmatter: Record<string, unknown>;
  summary: string;
  highlights: string[];
  raw: string;
}

/** 본문에서 첫 문단(summary)과 불릿 리스트(highlights)를 추출한다. */
export function extractBody(markdownBody: string): { summary: string; highlights: string[] } {
  const lines = markdownBody.trim().split("\n");
  const highlights: string[] = [];
  const summaryLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      inList = true;
      highlights.push(bulletMatch[1].trim());
    } else if (!inList && line.trim() !== "") {
      summaryLines.push(line.trim());
    }
  }

  return { summary: summaryLines.join(" "), highlights };
}

/** 단일 md 파일을 파싱하고 스키마로 검증한다. */
export async function parseContentFile(filePath: string): Promise<ParsedContent> {
  const raw = await readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const type = data.type as keyof typeof SCHEMA_BY_TYPE;
  const schema = SCHEMA_BY_TYPE[type];
  if (!schema) {
    throw new Error(`알 수 없는 type: "${data.type}" (${filePath})`);
  }

  const frontmatter = schema.parse(data);
  const { summary, highlights } = extractBody(content);

  return { frontmatter, summary, highlights, raw: content };
}

// TODO(M1): loadResumeModel(contentDir) — 디렉토리 전체를 읽어
//   { basics, experience[], projects[], education[], skills, positions[] } 형태의
//   canonical ResumeModel을 조립한다. links[] 위키링크 존재 여부 검증도 여기서 수행.
