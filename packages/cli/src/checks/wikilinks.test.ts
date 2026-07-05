// packages/cli/src/checks/wikilinks.test.ts

import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { wikilinkTarget, resolveWikilink } from "./wikilinks.js";

const contentRoot = fileURLToPath(new URL("../../test/fixtures/content", import.meta.url));

describe("wikilinkTarget", () => {
  it("[[target]]에서 target을 추출한다", () => {
    expect(wikilinkTarget("[[projects/cluster]]")).toBe("projects/cluster");
  });

  it("alias와 heading을 제거한다", () => {
    expect(wikilinkTarget("[[notes/topic|별칭]]")).toBe("notes/topic");
    expect(wikilinkTarget("[[notes/topic#섹션]]")).toBe("notes/topic");
    expect(wikilinkTarget("[[notes/topic#섹션|별칭]]")).toBe("notes/topic");
  });
});

describe("resolveWikilink", () => {
  it("resume/ 아래 경로를 해석한다", () => {
    expect(resolveWikilink(contentRoot, "projects/cluster")).toBe(true);
  });

  it("notes/ 아래 경로를 해석한다", () => {
    expect(resolveWikilink(contentRoot, "topic")).toBe(true);
    expect(resolveWikilink(contentRoot, "notes/topic")).toBe(true);
  });

  it("존재하지 않는 대상은 false", () => {
    expect(resolveWikilink(contentRoot, "no/such/note")).toBe(false);
    expect(resolveWikilink(contentRoot, "")).toBe(false);
  });
});
