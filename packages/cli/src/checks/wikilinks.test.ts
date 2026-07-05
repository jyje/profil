// packages/cli/src/checks/wikilinks.test.ts

import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { wikilinkTarget, resolveWikilink } from "./wikilinks.js";

const contentRoot = fileURLToPath(new URL("../../test/fixtures/content", import.meta.url));

describe("wikilinkTarget", () => {
  it("extracts target from [[target]]", () => {
    expect(wikilinkTarget("[[projects/cluster]]")).toBe("projects/cluster");
  });

  it("strips the alias and heading", () => {
    expect(wikilinkTarget("[[notes/topic|alias]]")).toBe("notes/topic");
    expect(wikilinkTarget("[[notes/topic#section]]")).toBe("notes/topic");
    expect(wikilinkTarget("[[notes/topic#section|alias]]")).toBe("notes/topic");
  });
});

describe("resolveWikilink", () => {
  it("resolves paths under resume/", () => {
    expect(resolveWikilink(contentRoot, "projects/cluster")).toBe(true);
  });

  it("resolves paths under notes/", () => {
    expect(resolveWikilink(contentRoot, "topic")).toBe(true);
    expect(resolveWikilink(contentRoot, "notes/topic")).toBe(true);
  });

  it("returns false for a target that doesn't exist", () => {
    expect(resolveWikilink(contentRoot, "no/such/note")).toBe(false);
    expect(resolveWikilink(contentRoot, "")).toBe(false);
  });
});
