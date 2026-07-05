// packages/jari/src/render/html.ts
//
// Renders an assembled per-position resume as a single self-contained HTML
// document: no external requests, all styling inlined from the design
// tokens. Layout follows design/Design.md: single column, 720px max width,
// one accent color, print-friendly (A4 margins, no background ink).

import type { AssembledResume } from "../assemble.js";
import type { DesignTokens } from "../design.js";
import { sectionLabels, formatPeriod } from "./common.js";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stylesheet(t: DesignTokens): string {
  return `
:root {
  --color-background: ${t.color.background};
  --color-text: ${t.color.text};
  --color-text-muted: ${t.color.text_muted};
  --color-accent: ${t.color.accent};
  --color-border: ${t.color.border};
}
* { box-sizing: border-box; }
body {
  margin: 0 auto;
  padding: 2rem 1.5rem;
  max-width: ${t.layout.max_width_content};
  background: var(--color-background);
  color: var(--color-text);
  font-family: ${t.typography.font_body};
  line-height: ${t.typography.line_height.body};
}
h1, h2, h3 {
  font-family: ${t.typography.font_heading};
  line-height: ${t.typography.line_height.heading};
}
h1 { margin: 0 0 0.25rem; font-size: 2rem; }
h2 {
  margin: 2rem 0 0.5rem;
  font-size: 1.125rem;
  color: var(--color-accent);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.25rem;
}
h3 { margin: 1.25rem 0 0.125rem; font-size: 1rem; }
p { margin: 0.375rem 0; }
ul { margin: 0.375rem 0; padding-left: 1.25rem; }
li { margin: 0.125rem 0; }
a { color: var(--color-accent); text-decoration: none; }
.role { margin: 0; color: var(--color-text); }
.meta { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); }
.contact { font-size: 0.875rem; color: var(--color-text-muted); }
.contact a { color: var(--color-text-muted); text-decoration: underline; }
@media print {
  @page { size: ${t.print.page_size}; margin: ${t.print.margin.top} ${t.print.margin.right} ${t.print.margin.bottom} ${t.print.margin.left}; }
  body { padding: 0; max-width: none; background: none; }
  a { color: inherit; text-decoration: none; }
}
`.trim();
}

export function renderHtml(assembled: AssembledResume, tokens: DesignTokens): string {
  const { basics, position, experience, projects, education, skills } = assembled;
  const labels = sectionLabels(position.data.lang);
  const out: string[] = [];

  out.push("<!doctype html>");
  out.push(`<html lang="${esc(position.data.lang)}">`);
  out.push("<head>");
  out.push('<meta charset="utf-8">');
  out.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  out.push(`<title>${esc(basics.data.name)} — ${esc(position.data.title)}</title>`);
  out.push(`<style>${stylesheet(tokens)}</style>`);
  out.push("</head>");
  out.push("<body>");

  // Header
  out.push(`<h1>${esc(basics.data.name)}</h1>`);
  const headline = position.data.headline ? ` — ${esc(position.data.headline)}` : "";
  out.push(`<p class="role"><strong>${esc(position.data.title)}</strong>${headline}</p>`);
  const contactParts = [
    basics.data.email && `<a href="mailto:${esc(basics.data.email)}">${esc(basics.data.email)}</a>`,
    basics.data.phone && esc(basics.data.phone),
    basics.data.location && esc(basics.data.location),
    ...(basics.data.socials ?? []).map(
      (s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`,
    ),
  ].filter((p): p is string => !!p);
  if (contactParts.length > 0) {
    out.push(`<p class="contact">${contactParts.join(" · ")}</p>`);
  }
  if (basics.summary) out.push(`<p>${esc(basics.summary)}</p>`);

  const highlightList = (highlights: string[]) => {
    if (highlights.length === 0) return;
    out.push("<ul>");
    for (const h of highlights) out.push(`<li>${esc(h)}</li>`);
    out.push("</ul>");
  };

  // Experience
  if (experience.length > 0) {
    out.push(`<h2>${esc(labels.experience)}</h2>`);
    for (const e of experience) {
      out.push(`<h3>${esc(e.data.company)} — ${esc(e.data.role)}</h3>`);
      const meta = [formatPeriod(e.data.period, labels), e.data.location]
        .filter((p): p is string => !!p)
        .map(esc)
        .join(" · ");
      if (meta) out.push(`<p class="meta">${meta}</p>`);
      if (e.summary) out.push(`<p>${esc(e.summary)}</p>`);
      highlightList(e.highlights);
    }
  }

  // Projects
  if (projects.length > 0) {
    out.push(`<h2>${esc(labels.projects)}</h2>`);
    for (const p of projects) {
      const title = [p.data.title, p.data.role].filter((x): x is string => !!x).map(esc);
      out.push(`<h3>${title.join(" — ")}</h3>`);
      const meta = [
        formatPeriod(p.data.period, labels) && esc(formatPeriod(p.data.period, labels)),
        p.data.url && `<a href="${esc(p.data.url)}">${esc(p.data.url)}</a>`,
      ].filter((x): x is string => !!x);
      if (meta.length > 0) out.push(`<p class="meta">${meta.join(" · ")}</p>`);
      if (p.summary) out.push(`<p>${esc(p.summary)}</p>`);
      highlightList(p.highlights);
    }
  }

  // Education
  if (education.length > 0) {
    out.push(`<h2>${esc(labels.education)}</h2>`);
    for (const e of education) {
      const title = [e.data.institution, e.data.degree].filter((x): x is string => !!x).map(esc);
      out.push(`<h3>${title.join(" — ")}</h3>`);
      out.push(`<p class="meta">${esc(formatPeriod(e.data.period, labels))}</p>`);
    }
  }

  // Skills
  if (skills.length > 0) {
    out.push(`<h2>${esc(labels.skills)}</h2>`);
    out.push("<ul>");
    for (const g of skills) {
      out.push(`<li><strong>${esc(g.label)}</strong>: ${g.items.map(esc).join(", ")}</li>`);
    }
    out.push("</ul>");
  }

  out.push("</body>");
  out.push("</html>");
  out.push("");
  return out.join("\n");
}
