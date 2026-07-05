// packages/jari/src/assemble.test.ts

import { describe, it, expect } from "vitest";
import type { ResumeModel, ResumeEntry } from "./loader.js";
import type { Position } from "./schema.js";
import { assembleResume } from "./assemble.js";

function entry<T>(data: T, sourcePath = "test.md"): ResumeEntry<T> {
  return { data, summary: "", highlights: [], body: "", sourcePath };
}

function position(overrides: Partial<Position>): ResumeEntry<Position> {
  return entry({
    type: "position",
    lang: "en",
    slug: "alpha",
    title: "Alpha Engineer",
    include_sections: ["experience", "projects", "education", "skills"],
    sort_by: "weight",
    ...overrides,
  } as Position);
}

function makeModel(overrides: Partial<ResumeModel> = {}): ResumeModel {
  return {
    basics: entry({ type: "basics", lang: "en", name: "Test" } as never, "basics.md"),
    experience: [
      entry(
        {
          type: "experience", lang: "en", company: "Recent Co", role: "Engineer",
          period: { start: "2021-01", end: "present" },
          positions: ["alpha", "beta"], weight: { alpha: 10, beta: 4 },
        } as never,
        "experience/recent.md",
      ),
      entry(
        {
          type: "experience", lang: "en", company: "Old Co", role: "Engineer",
          period: { start: "2018-03", end: "2020-12" },
          positions: ["beta"], weight: { beta: 9 },
        } as never,
        "experience/old.md",
      ),
    ],
    projects: [],
    education: [
      entry(
        {
          type: "education", lang: "en", institution: "Uni",
          period: { start: "2012-03", end: "2018-02" },
        } as never,
        "education/uni.md",
      ),
    ],
    skills: entry(
      {
        type: "skills", lang: "en",
        groups: [
          { label: "Common", items: ["Git"] },
          { label: "Alpha only", items: ["K8s"], positions: ["alpha"] },
          { label: "Beta only", items: ["Postgres"], positions: ["beta"] },
        ],
      } as never,
      "skills.md",
    ),
    positions: [
      position({ slug: "alpha", sort_by: "weight" }),
      position({ slug: "beta", title: "Beta Engineer", sort_by: "period" }),
    ],
    ...overrides,
  } as ResumeModel;
}

describe("assembleResume", () => {
  it("filters entries by position tag", () => {
    const { assembled, errors } = assembleResume(makeModel(), { position: "alpha", lang: "en" });
    expect(errors).toEqual([]);
    expect(assembled!.experience.map((e) => e.data.company)).toEqual(["Recent Co"]);
  });

  it("sorts by per-position weight descending", () => {
    // beta weights: Old Co 9 > Recent Co 4 — but beta uses period sort, so
    // test weight sorting through a beta-view clone that sorts by weight
    const model = makeModel({
      positions: [position({ slug: "beta", sort_by: "weight" })],
    });
    const { assembled } = assembleResume(model, { position: "beta", lang: "en" });
    expect(assembled!.experience.map((e) => e.data.company)).toEqual(["Old Co", "Recent Co"]);
  });

  it("sorts by period: ongoing first, then newest start", () => {
    const { assembled } = assembleResume(makeModel(), { position: "beta", lang: "en" });
    // Recent Co is ongoing (end: present) so it wins despite lower beta weight
    expect(assembled!.experience.map((e) => e.data.company)).toEqual(["Recent Co", "Old Co"]);
  });

  it("filters skill groups: untagged groups are common, tagged groups match the slug", () => {
    const { assembled } = assembleResume(makeModel(), { position: "alpha", lang: "en" });
    expect(assembled!.skills.map((g) => g.label)).toEqual(["Common", "Alpha only"]);
  });

  it("include_sections excludes sections as empty arrays", () => {
    const model = makeModel({
      positions: [position({ slug: "alpha", include_sections: ["experience"] } as never)],
    });
    const { assembled } = assembleResume(model, { position: "alpha", lang: "en" });
    expect(assembled!.experience).toHaveLength(1);
    expect(assembled!.education).toEqual([]);
    expect(assembled!.skills).toEqual([]);
  });

  it("education ignores position tags and includes everything", () => {
    const { assembled } = assembleResume(makeModel(), { position: "alpha", lang: "en" });
    expect(assembled!.education.map((e) => e.data.institution)).toEqual(["Uni"]);
  });

  it("excludes entries in another language", () => {
    const model = makeModel();
    (model.experience[0].data as { lang: string }).lang = "ko";
    const { assembled } = assembleResume(model, { position: "alpha", lang: "en" });
    expect(assembled!.experience).toEqual([]);
  });

  it("reports an unknown position slug as an error with a null result", () => {
    const { assembled, errors } = assembleResume(makeModel(), { position: "ghost", lang: "en" });
    expect(assembled).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('"ghost"');
  });
});
