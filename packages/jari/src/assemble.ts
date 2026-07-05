// packages/jari/src/assemble.ts
//
// Assembles a per-position view of the resume: filters experience/projects
// by position tag, sorts them per the position's sort_by rule, and narrows
// skills to the groups relevant to that position. This is the "different
// resume per position" core of the project.
//
// Current scope (M1): entries are matched on lang equality only. Merging or
// falling back across languages is M3, alongside *.en.md handling in the
// loader.

import type {
  ResumeModel,
  ResumeEntry,
  ContentIssue,
} from "./loader.js";
import type { Basics, Experience, Project, Education, Position } from "./schema.js";

export interface AssembledSkillGroup {
  label: string;
  items: string[];
}

export interface AssembledResume {
  position: ResumeEntry<Position>;
  basics: ResumeEntry<Basics>;
  experience: ResumeEntry<Experience>[];
  projects: ResumeEntry<Project>[];
  education: ResumeEntry<Education>[];
  skills: AssembledSkillGroup[];
}

export interface AssembleResult {
  assembled: AssembledResume | null;
  errors: ContentIssue[];
}

interface Period {
  start: string;
  end?: string;
}

/** Shared shape of entries that can be filtered/sorted by position */
interface Tagged {
  lang: "ko" | "en";
  positions: string[];
  weight?: Record<string, number>;
  period?: Period;
}

/** Newest start first; entries without a period sort last */
function byStartDesc(a?: Period, b?: Period): number {
  return (b?.start ?? "").localeCompare(a?.start ?? "");
}

function filterAndSort<T extends Tagged>(
  entries: ResumeEntry<T>[],
  slug: string,
  lang: string,
  sortBy: "weight" | "period",
): ResumeEntry<T>[] {
  const filtered = entries.filter(
    (e) => e.data.lang === lang && e.data.positions.includes(slug),
  );

  if (sortBy === "period") {
    // Ongoing entries first, then newest start first
    return filtered.sort((a, b) => {
      const ongoingA = a.data.period?.end === "present" ? 0 : 1;
      const ongoingB = b.data.period?.end === "present" ? 0 : 1;
      return ongoingA - ongoingB || byStartDesc(a.data.period, b.data.period);
    });
  }

  // weight (default): per-position weight descending, tie-broken by recency
  return filtered.sort((a, b) => {
    const wa = a.data.weight?.[slug] ?? 0;
    const wb = b.data.weight?.[slug] ?? 0;
    return wb - wa || byStartDesc(a.data.period, b.data.period);
  });
}

/**
 * Builds the resume view for one position and language.
 *
 * Returns null with errors when the position view definition itself is
 * missing; content-level mismatches (e.g. no entries tagged for the
 * position) are not errors — an empty section is a legitimate result.
 */
export function assembleResume(
  model: ResumeModel,
  opts: { position: string; lang: string },
): AssembleResult {
  const { position: slug, lang } = opts;
  const errors: ContentIssue[] = [];

  const position =
    model.positions.find((p) => p.data.slug === slug && p.data.lang === lang) ??
    model.positions.find((p) => p.data.slug === slug);
  if (!position) {
    errors.push({
      file: "positions/",
      message: `no position view is defined for slug "${slug}"`,
    });
    return { assembled: null, errors };
  }

  const sections = new Set(position.data.include_sections);
  const sortBy = position.data.sort_by;

  const experience = sections.has("experience")
    ? filterAndSort(model.experience, slug, lang, sortBy)
    : [];
  const projects = sections.has("projects")
    ? filterAndSort(model.projects, slug, lang, sortBy)
    : [];

  // Education has no position tags — it's the same for every position
  const education = sections.has("education")
    ? model.education
        .filter((e) => e.data.lang === lang)
        .sort((a, b) => byStartDesc(a.data.period, b.data.period))
    : [];

  // Skill groups: untagged groups are common to all positions; tagged groups
  // only appear on their positions
  const skills =
    sections.has("skills") && model.skills && model.skills.data.lang === lang
      ? model.skills.data.groups
          .filter((g) => !g.positions || g.positions.includes(slug))
          .map((g) => ({ label: g.label, items: g.items }))
      : [];

  return {
    assembled: { position, basics: model.basics, experience, projects, education, skills },
    errors,
  };
}
