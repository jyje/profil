// packages/jari/src/schema.ts
//
// Schema that content/resume/**/*.md frontmatter must follow.
// This file is the single source of truth for content structure. If a field
// needs to be added or changed, edit this file first, per AGENTS.md.

import { z } from "zod";

/** Fields common to every md content file */
const BaseFrontmatter = z.object({
  lang: z.enum(["ko", "en"]).default("ko"),
  // Wikilinks to knowledge-base/portfolio entries. Existence is verified at build time.
  links: z.array(z.string()).optional(),
});

export const PeriodSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}$/, "must be in YYYY-MM format"),
  end: z.string().regex(/^\d{4}-\d{2}$/).or(z.literal("present")).optional(),
});

/** content/resume/basics.md */
export const BasicsSchema = BaseFrontmatter.extend({
  type: z.literal("basics"),
  name: z.string(),
  headline: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  socials: z
    .array(z.object({ label: z.string(), url: z.url() }))
    .optional(),
});

/** content/resume/experience/*.md */
export const ExperienceSchema = BaseFrontmatter.extend({
  type: z.literal("experience"),
  company: z.string(),
  role: z.string(),
  period: PeriodSchema,
  location: z.string().optional(),
  positions: z.array(z.string()).default([]), // matches a slug in positions/*.md
  weight: z.record(z.string(), z.number()).optional(), // per-position display priority
});

/** content/resume/projects/*.md */
export const ProjectSchema = BaseFrontmatter.extend({
  type: z.literal("project"),
  title: z.string(),
  period: PeriodSchema.optional(),
  role: z.string().optional(),
  positions: z.array(z.string()).default([]),
  weight: z.record(z.string(), z.number()).optional(),
  url: z.url().optional(),
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
      positions: z.array(z.string()).optional(), // highlighted only for specific positions
    }),
  ),
});

/** content/resume/positions/*.md — per-position view definition */
export const PositionSchema = BaseFrontmatter.extend({
  type: z.literal("position"),
  slug: z.string(), // matches the positions[] tag on experience/project entries
  title: z.string(), // e.g. "MLOps Engineer"
  headline: z.string().optional(), // one-line intro at the top of this position's resume
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
