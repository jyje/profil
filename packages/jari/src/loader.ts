// packages/jari/src/loader.ts
//
// Scans the whole content/resume/ directory and assembles it into a
// canonical ResumeModel. Errors are never thrown — they're all collected and
// returned so the CLI can report them together.
//
// Current scope (M1): a lang suffix (*.en.md) is read as a separate entry.
// Per-language merging/fallback is handled in M3 alongside position variants.

import matter from "gray-matter";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
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

/** A validation/parsing problem found in a single file */
export interface ContentIssue {
  file: string; // relative to contentDir
  message: string;
}

/** One md file = validated frontmatter + extracted body */
export interface ResumeEntry<T> {
  data: T;
  summary: string;
  highlights: string[];
  body: string;
  sourcePath: string; // relative to contentDir
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
  /** null if basics is invalid (all other errors are still collected) */
  model: ResumeModel | null;
  errors: ContentIssue[];
}

/**
 * The slice of a zod schema this loader needs, with T pinned to the parsed
 * Output type. Structural on purpose: it survives zod major-version changes
 * to the ZodType generics (v3's ZodTypeDef parameter is gone in v4).
 */
interface SchemaLike<T> {
  safeParse(data: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

async function parseEntry<T>(
  schema: SchemaLike<T>,
  filePath: string,
  contentDir: string,
  errors: ContentIssue[],
): Promise<ResumeEntry<T> | null> {
  // sourcePath is a logical contentDir-relative path shown to users and used
  // in messages — keep it forward-slashed on every OS
  const rel = relative(contentDir, filePath).split(sep).join("/");

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (e) {
    errors.push({ file: rel, message: `failed to read file: ${(e as Error).message}` });
    return null;
  }

  let data: Record<string, unknown>;
  let content: string;
  try {
    ({ data, content } = matter(raw));
  } catch (e) {
    errors.push({ file: rel, message: `failed to parse frontmatter: ${(e as Error).message}` });
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

/** Lists a directory's md files (excluding README.md, sorted by name) */
async function listMarkdown(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .sort()
    .map((f) => join(dir, f));
}

async function loadDir<T>(
  schema: SchemaLike<T>,
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
 * Scans the whole content/resume directory and assembles a ResumeModel.
 *
 * - basics.md is required, skills.md is optional
 * - md files under experience/, projects/, education/, positions/ are each
 *   validated against their schema
 * - duplicate position slugs (within the same lang) are collected as errors
 */
export async function loadResumeModel(contentDir: string): Promise<LoadResumeResult> {
  const errors: ContentIssue[] = [];

  if (!existsSync(contentDir)) {
    return {
      model: null,
      errors: [{ file: ".", message: `content directory not found: ${contentDir}` }],
    };
  }

  const basicsPath = join(contentDir, "basics.md");
  let basics: ResumeEntry<Basics> | null = null;
  if (existsSync(basicsPath)) {
    basics = await parseEntry(BasicsSchema, basicsPath, contentDir, errors);
  } else {
    errors.push({ file: "basics.md", message: "required file is missing" });
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
        message: `duplicate position slug: "${pos.data.slug}" (lang=${pos.data.lang}, first defined in: ${prev})`,
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
