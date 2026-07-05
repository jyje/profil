// packages/jari/src/render.test.ts

import { describe, it, expect } from "vitest";
import type { AssembledResume } from "./assemble.js";
import type { ResumeEntry } from "./loader.js";
import { renderMarkdown } from "./render/markdown.js";
import { renderHtml } from "./render/html.js";
import { DEFAULT_TOKENS } from "./design.js";

function entry<T>(data: T, extras: Partial<ResumeEntry<T>> = {}): ResumeEntry<T> {
  return { data, summary: "", highlights: [], body: "", sourcePath: "test.md", ...extras };
}

function makeAssembled(): AssembledResume {
  return {
    position: entry({
      type: "position", lang: "ko", slug: "mlops", title: "MLOps Engineer",
      headline: "Serving platforms", include_sections: [], sort_by: "weight",
    } as never),
    basics: entry(
      {
        type: "basics", lang: "ko", name: "홍길동", email: "hong@example.com",
        socials: [{ label: "GitHub", url: "https://github.com/example" }],
      } as never,
      { summary: "Intro line." },
    ),
    experience: [
      entry(
        {
          type: "experience", lang: "ko", company: "ACME", role: "Engineer",
          period: { start: "2021-01", end: "present" }, positions: ["mlops"],
        } as never,
        { summary: "Ran the platform.", highlights: ["Did A", "Did B"] },
      ),
    ],
    projects: [],
    education: [],
    skills: [{ label: "Infra", items: ["Kubernetes", "Terraform"] }],
  };
}

describe("renderMarkdown", () => {
  it("renders header, section headings in the content language, and entries", () => {
    const md = renderMarkdown(makeAssembled());

    expect(md).toContain("# 홍길동");
    expect(md).toContain("**MLOps Engineer** — Serving platforms");
    expect(md).toContain("[GitHub](https://github.com/example)");
    expect(md).toContain("## 경력"); // ko content -> ko section heading
    expect(md).toContain("### ACME — Engineer");
    expect(md).toContain("2021-01 – 현재");
    expect(md).toContain("- Did A");
    expect(md).toContain("- **Infra**: Kubernetes, Terraform");
    expect(md).not.toContain("## 프로젝트"); // empty sections are omitted
  });
});

describe("renderHtml", () => {
  it("escapes user content", () => {
    const assembled = makeAssembled();
    (assembled.experience[0].data as { company: string }).company =
      '<script>alert("x")</script>';

    const html = renderHtml(assembled, DEFAULT_TOKENS);

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("inlines design tokens into the stylesheet", () => {
    const html = renderHtml(makeAssembled(), DEFAULT_TOKENS);

    expect(html).toContain(`--color-accent: ${DEFAULT_TOKENS.color.accent}`);
    expect(html).toContain(`max-width: ${DEFAULT_TOKENS.layout.max_width_content}`);
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain("<title>홍길동 — MLOps Engineer</title>");
  });
});
