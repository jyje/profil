// packages/jari/src/parser.test.ts
//
// Core M1 verification: md -> model parsing passes the schema, and
// summary/highlights are extracted from the body without loss.

import { describe, it, expect } from "vitest";
import { extractBody } from "./parser.js";

describe("extractBody", () => {
  it("splits the first paragraph into summary and bullets into highlights", () => {
    const body = `Designed and operated a Kubernetes-based ML serving platform.

- Cut training cost 40% via GPU cluster orchestration
- Built the standard MLOps pipeline and onboarded 5 teams`;

    const { summary, highlights } = extractBody(body);

    expect(summary).toBe("Designed and operated a Kubernetes-based ML serving platform.");
    expect(highlights).toEqual([
      "Cut training cost 40% via GPU cluster orchestration",
      "Built the standard MLOps pipeline and onboarded 5 teams",
    ]);
  });
});

// TODO(M1): add fixture-based tests against real files for parseContentFile()
// TODO(M1): add a round-trip (md -> model -> md) equivalence test once the
// model -> md reverse-generation function is implemented
