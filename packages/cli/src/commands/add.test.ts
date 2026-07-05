// packages/cli/src/commands/add.test.ts

import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { slugify, buildEntry } from "./add.js";

describe("slugify", () => {
  it("공백을 하이픈으로, 소문자로 바꾼다", () => {
    expect(slugify("Example Company")).toBe("example-company");
  });

  it("한글을 유지한다", () => {
    expect(slugify("예시 회사")).toBe("예시-회사");
  });

  it("특수문자를 제거하고 하이픈을 정리한다", () => {
    expect(slugify("ACME Corp. (Seoul)!")).toBe("acme-corp-seoul");
  });
});

describe("buildEntry", () => {
  it("experience: 유효한 플래그로 파싱 가능한 md를 만든다", () => {
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
    expect(data.lang).toBe("ko"); // 기본값이 적용되어 직렬화됨
  });

  it("experience: 필수 값이 빠지면 오류를 전부 보고한다", () => {
    const { errors } = buildEntry("experience", {});
    const joined = errors.join("\n");
    expect(joined).toContain("company");
    expect(joined).toContain("role");
    expect(joined).toContain("period");
  });

  it("position: title에서 slug를 유도한다", () => {
    const { relPath, content, errors } = buildEntry("position", {
      title: "Platform Engineer",
    });

    expect(errors).toEqual([]);
    expect(relPath).toBe("positions/platform-engineer.md");
    expect(matter(content).data.slug).toBe("platform-engineer");
  });

  it("--slug로 파일명을 재정의할 수 있다", () => {
    const { relPath } = buildEntry("project", { title: "아주 긴 프로젝트 이름", slug: "short" });
    expect(relPath).toBe("projects/short.md");
  });
});
