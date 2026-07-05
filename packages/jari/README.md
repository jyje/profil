# @madang/jari

구조화 마크다운(`content/resume/**/*.md`)을 단일 소스로, HTML/PDF/DOCX 이력서를 생성하는 엔진.

포지션("자리")마다 다른 이력서를 조립하는 것이 이름의 유래입니다.

## 상태

`src/schema.ts`에 데이터 모델이, `src/parser.ts`에 단일 파일 파서가, `src/loader.ts`에
디렉토리 로더가 있습니다. 아래 순서로 구현을 진행하세요:

### M1 — 코어
- [x] `loader.ts`의 `loadResumeModel(contentDir)` 구현: 디렉토리 전체 스캔 → canonical model 조립
      (오류는 throw 대신 전부 수집 — `@madang/cli`의 `check` 명령이 보고)
- [ ] round-trip 테스트: md → model → md 재생성 시 내용 손실 없음을 검증
- [ ] `render/html.ts`: canonical model → 단일 HTML 페이지 (디자인 토큰 CSS 변수 사용)
- [ ] `positions/*.md` 필터링 로직: 태그+weight로 경력/프로젝트 정렬

### M2 — 출력 매트릭스
- [ ] `render/pdf.ts`: Playwright로 HTML → PDF (jyje/profile의 `pdf-config.yml` 방식 참고)
- [ ] `design/tokens.yaml` → `reference.docx` 생성 스크립트
- [ ] `render/docx.ts`: Pandoc 호출 wrapper
- [ ] CLI: `jari build [--position mlops] [--lang ko] [--format pdf,docx,html]`

## 사용 예 (M1 완료 후 목표 API)

```ts
import { loadResumeModel } from "@madang/jari";
import { renderHtml } from "@madang/jari/render/html";

const model = await loadResumeModel("./content/resume");
const html = renderHtml(model, { position: "mlops", lang: "ko" });
```

## 콘텐츠 작성 규약

`content/resume/README.md` 참고. 요약하면: frontmatter는 구조, 본문 첫 문단은 요약,
불릿 리스트는 성과 하이라이트.
