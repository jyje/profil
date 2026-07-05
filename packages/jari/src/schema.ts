// packages/jari/src/schema.ts
//
// content/resume/**/*.md 의 frontmatter가 따라야 하는 스키마.
// 이 파일이 콘텐츠 구조의 단일 진실입니다. 필드를 추가/변경하면
// AGENTS.md 규약에 따라 먼저 여기를 수정하세요.

import { z } from "zod";

/** 모든 md 콘텐츠 파일이 공통으로 갖는 필드 */
const BaseFrontmatter = z.object({
  lang: z.enum(["ko", "en"]).default("ko"),
  // 지식기반/포트폴리오 항목으로의 위키링크. 빌드 시 존재 여부를 검증한다.
  links: z.array(z.string()).optional(),
});

export const PeriodSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM 형식"),
  end: z.string().regex(/^\d{4}-\d{2}$/).or(z.literal("present")).optional(),
});

/** content/resume/basics.md */
export const BasicsSchema = BaseFrontmatter.extend({
  type: z.literal("basics"),
  name: z.string(),
  headline: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  socials: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .optional(),
});

/** content/resume/experience/*.md */
export const ExperienceSchema = BaseFrontmatter.extend({
  type: z.literal("experience"),
  company: z.string(),
  role: z.string(),
  period: PeriodSchema,
  location: z.string().optional(),
  positions: z.array(z.string()).default([]), // positions/*.md 의 slug와 매칭
  weight: z.record(z.string(), z.number()).optional(), // 포지션별 노출 우선순위
});

/** content/resume/projects/*.md */
export const ProjectSchema = BaseFrontmatter.extend({
  type: z.literal("project"),
  title: z.string(),
  period: PeriodSchema.optional(),
  role: z.string().optional(),
  positions: z.array(z.string()).default([]),
  weight: z.record(z.string(), z.number()).optional(),
  url: z.string().url().optional(),
});

/** content/resume/education/*.md */
export const EducationSchema = BaseFrontmatter.extend({
  type: z.literal("education"),
  institution: z.string(),
  degree: z.string().optional(),
  period: PeriodSchema,
});

/** content/resume/skills.md */
export const SkillsSchema = BaseFrontmatter.extend({
  type: z.literal("skills"),
  groups: z.array(
    z.object({
      label: z.string(),
      items: z.array(z.string()),
      positions: z.array(z.string()).optional(), // 특정 포지션에서만 강조
    }),
  ),
});

/** content/resume/positions/*.md — 포지션별 뷰 정의 */
export const PositionSchema = BaseFrontmatter.extend({
  type: z.literal("position"),
  slug: z.string(), // experience/project의 positions[] 태그와 매칭
  title: z.string(), // 예: "MLOps Engineer"
  headline: z.string().optional(), // 이 포지션용 이력서 상단 한 줄 소개
  include_sections: z
    .array(z.enum(["experience", "projects", "education", "skills"]))
    .default(["experience", "projects", "education", "skills"]),
  sort_by: z.enum(["weight", "period"]).default("weight"),
});

export type Basics = z.infer<typeof BasicsSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skills = z.infer<typeof SkillsSchema>;
export type Position = z.infer<typeof PositionSchema>;
