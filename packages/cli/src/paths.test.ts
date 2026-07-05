// packages/cli/src/paths.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { madangHome } from "./paths.js";

const ORIGINAL = process.env.MADANG_HOME;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.MADANG_HOME;
  else process.env.MADANG_HOME = ORIGINAL;
});

describe("madangHome", () => {
  it("기본값은 홈 디렉토리의 .madang", () => {
    delete process.env.MADANG_HOME;
    expect(madangHome()).toBe(join(homedir(), ".madang"));
  });

  it("MADANG_HOME 환경변수로 재정의할 수 있다", () => {
    process.env.MADANG_HOME = "/tmp/custom-madang";
    expect(madangHome()).toBe("/tmp/custom-madang");
  });
});
