// packages/jari/src/render/markdown.ts
//
// Renders an assembled per-position resume as a single Markdown document.
// Output is deterministic: same input, same string.

import type { AssembledResume } from "../assemble.js";
import { sectionLabels, formatPeriod } from "./common.js";

function joinParts(parts: (string | undefined)[], separator: string): string {
  return parts.filter((p): p is string => !!p && p.trim() !== "").join(separator);
}

export function renderMarkdown(assembled: AssembledResume): string {
  const { basics, position, experience, projects, education, skills } = assembled;
  const labels = sectionLabels(position.data.lang);
  const out: string[] = [];

  // Header
  out.push(`# ${basics.data.name}`);
  out.push("");
  out.push(joinParts([`**${position.data.title}**`, position.data.headline], " — "));
  const socials = (basics.data.socials ?? []).map((s) => `[${s.label}](${s.url})`);
  const contact = joinParts(
    [basics.data.email, basics.data.phone, basics.data.location, ...socials],
    " · ",
  );
  if (contact) {
    out.push("");
    out.push(contact);
  }
  if (basics.summary) {
    out.push("");
    out.push(basics.summary);
  }

  // Experience
  if (experience.length > 0) {
    out.push("");
    out.push(`## ${labels.experience}`);
    for (const e of experience) {
      out.push("");
      out.push(`### ${e.data.company} — ${e.data.role}`);
      out.push("");
      out.push(joinParts([formatPeriod(e.data.period, labels), e.data.location], " · "));
      if (e.summary) {
        out.push("");
        out.push(e.summary);
      }
      if (e.highlights.length > 0) {
        out.push("");
        for (const h of e.highlights) out.push(`- ${h}`);
      }
    }
  }

  // Projects
  if (projects.length > 0) {
    out.push("");
    out.push(`## ${labels.projects}`);
    for (const p of projects) {
      out.push("");
      out.push(`### ${joinParts([p.data.title, p.data.role], " — ")}`);
      const meta = joinParts([formatPeriod(p.data.period, labels), p.data.url], " · ");
      if (meta) {
        out.push("");
        out.push(meta);
      }
      if (p.summary) {
        out.push("");
        out.push(p.summary);
      }
      if (p.highlights.length > 0) {
        out.push("");
        for (const h of p.highlights) out.push(`- ${h}`);
      }
    }
  }

  // Education
  if (education.length > 0) {
    out.push("");
    out.push(`## ${labels.education}`);
    for (const e of education) {
      out.push("");
      out.push(`### ${joinParts([e.data.institution, e.data.degree], " — ")}`);
      out.push("");
      out.push(formatPeriod(e.data.period, labels));
    }
  }

  // Skills
  if (skills.length > 0) {
    out.push("");
    out.push(`## ${labels.skills}`);
    out.push("");
    for (const g of skills) {
      out.push(`- **${g.label}**: ${g.items.join(", ")}`);
    }
  }

  out.push("");
  return out.join("\n");
}
