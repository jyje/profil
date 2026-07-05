// packages/jari/src/loader.test.ts
//
// loadResumeModel이 디렉토리 전체를 스캔해 모델을 조립하고,
// 오류를 throw 없이 전부 수집하는지 검증한다.

import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { loadResumeModel } from "./loader.js";

const fixtures = (name: string) =>
  fileURLToPath(new URL(`../test/fixtures/${name}`, import.meta.url));

describe("loadResumeModel", () => {
  it("유효한 디렉토리에서 모델을 조립한다", async () => {
    const { model, errors } = await loadResumeModel(fixtures("valid"));

    expect(errors).toEqual([]);
    expect(model).not.toBeNull();
    expect(model!.basics.data.name).toBe("테스트");
    expect(model!.experience).toHaveLength(1);
    expect(model!.experience[0].data.company).toBe("ACME");
    expect(model!.experience[0].highlights).toEqual(["성과 하나", "성과 둘"]);
    expect(model!.positions.map((p) => p.data.slug)).toEqual(["mlops"]);
    expect(model!.skills).toBeNull();
    expect(model!.projects).toEqual([]);
  });

  it("스키마 위반을 파일별로 전부 수집한다 (throw하지 않음)", async () => {
    const { model, errors } = await loadResumeModel(fixtures("invalid"));

    // basics가 유효하지 않으므로 model은 null
    expect(model).toBeNull();

    const files = errors.map((e) => e.file);
    expect(files).toContain("basics.md");
    expect(files.some((f) => f.endsWith("broken.md"))).toBe(true);
    // basics: name 누락 + email 형식 오류 = 최소 2건
    expect(errors.filter((e) => e.file === "basics.md").length).toBeGreaterThanOrEqual(2);
  });

  it("존재하지 않는 디렉토리는 오류 1건으로 보고한다", async () => {
    const { model, errors } = await loadResumeModel(fixtures("no-such-dir"));

    expect(model).toBeNull();
    expect(errors).toHaveLength(1);
  });
});
