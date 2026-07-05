// packages/jari/src/render/common.ts
//
// Bits shared by the markdown and HTML renderers. Section headings are
// document content, so they follow the resume's language (unlike source
// code and CLI output, which are English-only).

export interface SectionLabels {
  experience: string;
  projects: string;
  education: string;
  skills: string;
  present: string;
}

const LABELS: Record<string, SectionLabels> = {
  ko: {
    experience: "경력",
    projects: "프로젝트",
    education: "학력",
    skills: "기술",
    present: "현재",
  },
  en: {
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    skills: "Skills",
    present: "present",
  },
};

export function sectionLabels(lang: string): SectionLabels {
  return LABELS[lang] ?? LABELS.en;
}

export function formatPeriod(
  period: { start: string; end?: string } | undefined,
  labels: SectionLabels,
): string {
  if (!period) return "";
  const end = period.end === "present" ? labels.present : (period.end ?? "");
  return end ? `${period.start} – ${end}` : period.start;
}
