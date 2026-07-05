// packages/cli/src/commands/add.test.ts

import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { slugify, buildEntry } from "./add.js";

describe("slugify", () => {
  it("turns spaces into hyphens and lowercases", () => {
    expect(slugify("Example Company")).toBe("example-company");
  });

  it("keeps Korean characters", () => {
    expect(slugify("예시 회사")).toBe("예시-회사");
  });

  it("strips special characters and collapses hyphens", () => {
    expect(slugify("ACME Corp. (Seoul)!")).toBe("acme-corp-seoul");
  });
});

describe("buildEntry", () => {
  it("experience: builds parseable md from valid flags", () => {
    const { relPath, content, errors } = buildEntry("experience", {
      company: "ACME",
      role: "Engineer",
      start: "2024-01",
      end: "present",
      positions: "mlops, backend",
    });

    expect(errors).toEqual([]);
    expect(relPath).toBe("experience/acme.md");

    const { data } = matter(content);
    expect(data.type).toBe("experience");
    expect(data.company).toBe("ACME");
    expect(data.period).toEqual({ start: "2024-01", end: "present" });
    expect(data.positions).toEqual(["mlops", "backend"]);
    expect(data.lang).toBe("ko"); // default applied and serialized
  });

  it("experience: reports every missing required value", () => {
    const { errors } = buildEntry("experience", {});
    const joined = errors.join("\n");
    expect(joined).toContain("company");
    expect(joined).toContain("role");
    expect(joined).toContain("period");
  });

  it("position: derives the slug from the title", () => {
    const { relPath, content, errors } = buildEntry("position", {
      title: "Platform Engineer",
    });

    expect(errors).toEqual([]);
    expect(relPath).toBe("positions/platform-engineer.md");
    expect(matter(content).data.slug).toBe("platform-engineer");
  });

  it("--slug overrides the derived filename", () => {
    const { relPath } = buildEntry("project", { title: "아주 긴 프로젝트 이름", slug: "short" });
    expect(relPath).toBe("projects/short.md");
  });
});
