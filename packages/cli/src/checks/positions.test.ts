// packages/cli/src/checks/positions.test.ts

import { describe, it, expect } from "vitest";
import type { ResumeModel, ResumeEntry } from "@profil/jari";
import { checkPositionsIntegrity } from "./positions.js";

function entry<T>(data: T, sourcePath = "test.md"): ResumeEntry<T> {
  return { data, summary: "", highlights: [], body: "", sourcePath };
}

function makeModel(overrides: Partial<ResumeModel>): ResumeModel {
  return {
    basics: entry({ type: "basics", lang: "ko", name: "Test" } as never, "basics.md"),
    experience: [],
    projects: [],
    education: [],
    skills: null,
    positions: [
      entry({ type: "position", lang: "ko", slug: "mlops", title: "MLOps",
        include_sections: [], sort_by: "weight" } as never, "positions/mlops.md"),
    ],
    ...overrides,
  } as ResumeModel;
}

describe("checkPositionsIntegrity", () => {
  it("no errors when only defined slugs are used", () => {
    const model = makeModel({
      experience: [
        entry({ type: "experience", lang: "ko", company: "A", role: "E",
          period: { start: "2020-01" }, positions: ["mlops"],
          weight: { mlops: 5 } } as never, "experience/a.md"),
      ],
    });
    const { errors } = checkPositionsIntegrity(model, ["mlops"]);
    expect(errors).toEqual([]);
  });

  it("reports undefined tags, weight keys, and config positions as errors", () => {
    const model = makeModel({
      experience: [
        entry({ type: "experience", lang: "ko", company: "A", role: "E",
          period: { start: "2020-01" }, positions: ["ghost"],
          weight: { phantom: 1 } } as never, "experience/a.md"),
      ],
    });
    const { errors } = checkPositionsIntegrity(model, ["mlops", "missing"]);
    const messages = errors.map((e) => e.message).join("\n");
    expect(messages).toContain('"ghost"');
    expect(messages).toContain('"phantom"');
    expect(messages).toContain('"missing"');
    expect(errors).toHaveLength(3);
  });

  it("reports a position file missing from config as a warning", () => {
    const model = makeModel({});
    const { errors, warnings } = checkPositionsIntegrity(model, []);
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('"mlops"');
  });
});
