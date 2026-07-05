// packages/jari/src/parser.ts
//
// Reads content/resume/**/*.md and converts it into the canonical model.
// frontmatter -> zod schema validation, body -> summary/highlights[] extraction.
//
// Design rules (see README):
//   - frontmatter maps directly to structured fields
//   - the body's first paragraph -> summary
//   - the body's bullet list -> highlights[]
//   - this mapping must be lossless in reverse too (model -> md generation),
//     hence the round-trip test requirement

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

/** Extracts the first paragraph (summary) and bullet list (highlights) from the body. */
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

/** Parses a single md file and validates it against the schema. */
export async function parseContentFile(filePath: string): Promise<ParsedContent> {
  const raw = await readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const type = data.type as keyof typeof SCHEMA_BY_TYPE;
  const schema = SCHEMA_BY_TYPE[type];
  if (!schema) {
    throw new Error(`unknown type: "${data.type}" (${filePath})`);
  }

  const frontmatter = schema.parse(data);
  const { summary, highlights } = extractBody(content);

  return { frontmatter, summary, highlights, raw: content };
}

// loadResumeModel(contentDir) is implemented in loader.ts.
// Wikilink existence checks are done by @profil/cli's check command.
