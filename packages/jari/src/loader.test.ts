// packages/jari/src/loader.test.ts
//
// Verifies that loadResumeModel scans the whole directory and assembles the
// model, collecting every error instead of throwing.

import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { loadResumeModel } from "./loader.js";

const fixtures = (name: string) =>
  fileURLToPath(new URL(`../test/fixtures/${name}`, import.meta.url));

describe("loadResumeModel", () => {
  it("assembles the model from a valid directory", async () => {
    const { model, errors } = await loadResumeModel(fixtures("valid"));

    expect(errors).toEqual([]);
    expect(model).not.toBeNull();
    expect(model!.basics.data.name).toBe("Test");
    expect(model!.experience).toHaveLength(1);
    expect(model!.experience[0].data.company).toBe("ACME");
    expect(model!.experience[0].highlights).toEqual(["Achievement one", "Achievement two"]);
    expect(model!.positions.map((p) => p.data.slug)).toEqual(["mlops"]);
    expect(model!.skills).toBeNull();
    expect(model!.projects).toEqual([]);
  });

  it("collects every schema violation per file (never throws)", async () => {
    const { model, errors } = await loadResumeModel(fixtures("invalid"));

    // basics is invalid, so model is null
    expect(model).toBeNull();

    const files = errors.map((e) => e.file);
    expect(files).toContain("basics.md");
    expect(files.some((f) => f.endsWith("broken.md"))).toBe(true);
    // basics: missing name + invalid email = at least 2 errors
    expect(errors.filter((e) => e.file === "basics.md").length).toBeGreaterThanOrEqual(2);
  });

  it("reports a nonexistent directory as a single error", async () => {
    const { model, errors } = await loadResumeModel(fixtures("no-such-dir"));

    expect(model).toBeNull();
    expect(errors).toHaveLength(1);
  });
});
