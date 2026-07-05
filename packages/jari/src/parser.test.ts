// packages/jari/src/parser.test.ts
//
// M1 핵심 검증: md -> model 파싱이 스키마를 통과하고, 본문에서
// summary/highlights를 손실 없이 추출하는지 확인한다.

import { describe, it, expect } from "vitest";
import { extractBody } from "./parser.js";

describe("extractBody", () => {
  it("첫 문단을 summary로, 불릿을 highlights로 분리한다", () => {
    const body = `쿠버네티스 기반 ML 서빙 플랫폼을 설계하고 운영했습니다.

- GPU 클러스터 오케스트레이션으로 학습 비용 40% 절감
- 사내 MLOps 표준 파이프라인 구축 및 5개 팀 온보딩`;

    const { summary, highlights } = extractBody(body);

    expect(summary).toBe("쿠버네티스 기반 ML 서빙 플랫폼을 설계하고 운영했습니다.");
    expect(highlights).toEqual([
      "GPU 클러스터 오케스트레이션으로 학습 비용 40% 절감",
      "사내 MLOps 표준 파이프라인 구축 및 5개 팀 온보딩",
    ]);
  });
});

// TODO(M1): parseContentFile()에 대한 실제 파일 fixture 기반 테스트 추가
// TODO(M1): model -> md 역변환 함수 구현 후 round-trip(md -> model -> md) 동등성 테스트 추가
