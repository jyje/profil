# Madang 프로젝트 — 세션 핸드오프 (2026-07-05)

> 이 문서는 claude.ai 대화 세션에서 나온 논의, 결정, 그리고 각 결정의 근거를 정리한 것입니다.
> Claude Code에서 이 리포를 열고 이 파일을 먼저 읽으면 지금까지의 맥락을 그대로 이어받을 수
> 있습니다. (참고: AI의 원문 "thinking" 블록은 세션 밖으로 export되는 객체가 아니라, 이 문서는
> 그 사고 과정을 사람이 읽을 수 있게 재구성한 것입니다.)

## 1. 최초 요청과 문제 정의

사용자는 다음을 하나의 오픈소스 프로젝트로 묶으려 함:

- 로컬 하네스 + 웹 사이트 템플릿, 셀프호스팅/클라우드 둘 다 고려
- `jyje/profile`, `jyje/docs` 레포를 통합 마이그레이션할 대상
- 지식기반: Quartz류(Obsidian 연동 블로그)
- 포트폴리오: 개인/조직 소개, 지식기반으로의 자연스러운 링크
- **AI가 관리하는 온라인 이력서**, 개인 호스팅 가능
- 변경 시 PDF/Word에 즉시 반영
- **포지션별로 다른 이력서**가 준비되어 있어야 함 (예: 포지션 1, 포지션 2)

### 초기 평가 (근거)

- 각 조각(Quartz, 포트폴리오 템플릿, 이력서 빌더)은 개별로는 이미 존재하지만, "Obsidian vault
  하나가 single source of truth이고 웹/PDF/Word가 파생된다"는 통합 그림은 드묾 → 차별점.
- **왜 이력서가 마크다운/YAML 산문이 아니라 구조화 데이터여야 하는가**: PDF/Word 자동 반영 +
  포지션별 변형을 동시에 만족하려면, 이력서를 "필터링된 뷰"로 다룰 수 있어야 함. 그러려면
  경력/프로젝트 항목에 태그(포지션)와 메타데이터가 있어야 하고, 산문 텍스트로는 이게 안 됨.
- **Quartz를 탭으로 품는 문제**: Quartz는 독립 사이트 전제라 서브패스 임베드(빠름, 디자인 불일치
  위험) vs 포크 내장(유지보수 부담) vs 자체 렌더러(Astro + remark-wiki-link, 초기비용 큼 하지만
  장기적으로 디자인/빌드 일관성 최고) 3가지 선택지가 있음. → **M4까지 결정 유예**, 초기엔
  서브패스 임베드로 시작.
- **정적 우선(static-first) 배포**: 산출물이 정적 파일 + PDF/DOCX 아티팩트면 셀프호스팅/클라우드
  선택이 배포 타겟 차이일 뿐 빌드는 동일 → 배포 고민을 뒤로 미룰 수 있음.
- **리스크**: 지식기반 렌더러 + 이력서 엔진 + 디자인 시스템 + AI 하네스를 동시에 만들면 완성 못
  할 위험. → 1차 마일스톤을 "resume 엔진" 하나로 좁히자고 제안.

## 2. jyje/profile 레포 실사 (web_fetch로 직접 확인)

기존 레포 구조를 GitHub API로 직접 조회해서 확인한 사실:

- `_data/resume-ko.yml`, `_data/resume-en.yml` — 이력서 데이터가 YAML
- `ko/`, `en/` 이중 언어 페이지 구조
- `pdf-config.yml` — **Playwright 기반 PDF 파이프라인이 이미 검증되어 동작 중**
  (`prefer_css_page_size`, viewport, 폰트 로딩 타임아웃 등 실전 설정 포함)
- `.claude/`, `AGENTS.md` 존재 — AI 하네스의 씨앗이 이미 있음
- `profile/cv.md` — 별도 CV 마크다운도 존재 (구조 파악 필요, 이번 세션에서는 상세히 열어보지
  않음 — **다음 세션 TODO**)

→ 결론: 새 프로젝트는 이 구조를 오마주하되, (1) 데이터 계층을 YAML → 구조화 마크다운으로 승격,
(2) DOCX 출력 경로 신규 추가.

## 3. 이력서 데이터 포맷 결정: YAML vs 구조화 Markdown

사용자가 구조화 마크다운(md/mdx)을 원함, 이유: YAML과 1:1 매핑 가능 + Obsidian에서 편집 편함.

### 결정한 매핑 규칙 (근거: 무손실 왕복 변환이 되어야 파서/생성기 양방향이 성립)

- frontmatter → 구조 필드 (그대로 YAML 키에 대응)
- 본문 첫 문단 → `summary`
- 본문 불릿 리스트 → `highlights[]`
- **MDX는 웹 전용 인터랙션 페이지에만 허용, 이력서 데이터 파일은 순수 md로 제한** — 이유: JSX는
  PDF/DOCX 렌더러가 이해할 방법이 없어 1:1 매핑이 깨짐.
- 포지션 변형은 데이터가 아니라 **뷰 정의로 분리** (`positions/*.md`) — 경력/프로젝트 항목에
  `positions: [...]` 태그 + `weight` 우선순위를 달고, position 파일이 필터/정렬 규칙을 선언.
  새 포지션 추가 = 파일 하나 추가로 끝나야 한다는 요구사항 때문.

## 4. 디자인 시스템 vs 다중 포맷 출력의 충돌과 해법

- 문제: CSS는 DOCX에 적용되지 않음. 웹/PDF/Word가 "같은 디자인"이려면 CSS가 아니라 **토큰이
  최상위 진실**이어야 함.
- 해법: `design/tokens.yaml`에서 (1) CSS 변수, (2) print CSS, (3) Pandoc `reference.docx`의
  스타일 정의를 각각 생성하는 빌드 스텝. `Design.md`는 토큰의 사람/AI용 설명 문서.
- PDF는 jyje/profile의 검증된 Playwright 방식 그대로 이식 (재발명 불필요).
- DOCX 품질이 나중에 아쉬우면 Pandoc → 네이티브 docx 라이브러리로 교체할 여지를 남겨둠
  (아직 결정 안 함, **오픈 이슈**).

## 5. 프로젝트/패키지 이름

한국적이면서 영어로도 깔끔해야 한다는 요구.

- **Madang (마당)** — 모노레포/사이트 이름으로 선택. 한옥 마당(손님 맞이, 물건을 펼쳐 보이는
  열린 공간)의 은유가 "포트폴리오+지식기반+이력서가 한데 모인 개인 사이트"와 정확히 맞음.
  영어로도 2음절로 자연스럽게 읽힘.
- **Jari (자리)** — 이력서 엔진 패키지 이름. "자리" = 포지션이라는 의미가 이름 자체에 담겨서
  "포지션별 이력서" 기능과 직결됨. `@madang/jari`.
- 검토했으나 채택 안 한 대안: Teo(터), Munpae(문패) — 은유는 좋으나 마당+자리 조합의 기능적
  적합성이 더 높다고 판단.

## 6. 스캐폴드로 구현한 것 (이번 세션에서 실제로 생성, zip으로 전달됨)

```
madang/
├── README.md              # 프로젝트 개요, 구조, 로드맵(M1~M4)
├── AGENTS.md               # Claude Code가 자동 로드하는 작업 규약
├── LICENSE (MIT)
├── package.json             # npm workspaces 루트
├── madang.config.yaml       # 언어/탭/배포 설정
├── design/
│   ├── tokens.yaml          # 색상/타이포/간격/print/docx 매핑 정의
│   └── Design.md             # 토큰 설명 + 변경 체크리스트
├── content/
│   ├── resume/
│   │   ├── README.md         # md↔데이터 매핑 규약 문서
│   │   ├── basics.md          # 샘플
│   │   ├── experience/example-company.md  # 샘플 (positions, weight, links 포함)
│   │   ├── positions/mlops.md   # 포지션 1 뷰 정의
│   │   ├── positions/backend.md # 포지션 2 뷰 정의
│   │   └── skills.md            # 샘플
│   ├── portfolio/README.md    # jyje/profile 포트폴리오 마이그레이션 안내
│   └── notes/README.md         # jyje/docs → Obsidian vault 안내, 퍼머링크 규약
├── packages/
│   ├── jari/
│   │   ├── package.json, tsconfig.json, README.md (M1~M2 구현 순서 명시)
│   │   └── src/
│   │       ├── schema.ts       # zod 스키마 전체 (Basics/Experience/Project/
│   │       │                    Education/Skills/Position) — **콘텐츠 구조의 단일 진실**
│   │       ├── parser.ts       # extractBody() 구현됨, parseContentFile() 구현됨,
│   │       │                    loadResumeModel() 은 TODO(M1) 스텁
│   │       └── parser.test.ts  # extractBody 단위 테스트 1건 (통과 가능한 로직)
│   └── site/
│       ├── package.json, README.md (Astro vs Jekyll 결정 필요 사항 명시)
└── .github/workflows/build.yml  # CI 스텁 (npm test && npm run build)
```

### 구현 상태 (정확히 어디까지 코드가 있는가)

- **실제 동작하는 코드**: `schema.ts` 전체(zod 정의), `parser.ts`의 `extractBody()`와
  `parseContentFile()` (단일 파일 파싱 + 스키마 검증까지는 됨), 이에 대한 테스트 1건
- **TODO 스텁만 있음**: `loadResumeModel(contentDir)` (디렉토리 전체 스캔 → canonical model
  조립 — **다음 세션에서 이것부터 구현해야 함**), HTML/PDF/DOCX 렌더러, CLI, tokens →
  CSS/reference.docx 생성 스크립트, packages/site 전체

## 7. 로드맵 (합의된 순서)

- **M1 — Jari 코어**: md 파서 + zod 스키마(완료) + canonical model 조립(`loadResumeModel`,
  미구현) + round-trip 테스트(model→md 역변환 함수 자체가 아직 없음) + 기본 HTML 렌더러
- **M2 — 출력 매트릭스**: PDF(Playwright, jyje/profile 방식 이식), DOCX(Pandoc +
  reference.docx 생성), CLI(`jari build --position --lang --format`), CI 아티팩트 업로드
- **M3 — 포지션 변형 + AI 하네스**: positions 필터링 로직(태그+weight 정렬), 링크 무결성 검사
  (위키링크 대상 존재 검증), AGENTS.md 워크플로우 실전 적용
- **M4 — Madang 사이트 통합**: 포트폴리오 탭(jyje/profile 마이그레이션), 지식기반 탭(Quartz
  서브패스 임베드 → 이후 자체 렌더러), 이력서 웹페이지+다운로드 버튼, Astro vs Jekyll 결정,
  셀프호스팅/클라우드 배포 문서화

## 8. 오픈 이슈 / 아직 결정 안 된 것

- `packages/site`의 프레임워크: Astro vs Jekyll (jyje/profile과의 마이그레이션 비용 vs
  wikilink 생태계 트레이드오프, README에 명시해둠)
- DOCX 렌더링: Pandoc reference.docx 방식 vs 네이티브 docx 라이브러리 — 품질 보고 나서 결정
- `content/notes/`(Obsidian vault)와 지식기반 탭의 최종 렌더러 (M4까지 유예)
- `jyje/profile`의 `profile/cv.md`, `_featured_categories/`, `_featured_tags/`,
  `_legacy/` 등 아직 상세히 조사 안 한 디렉토리 — 마이그레이션 계획 세울 때 참고 필요
- 포트폴리오 스키마(`PortfolioSchema`)가 아직 zod로 정의 안 됨 — `ProjectSchema` 확장 여부
  결정 필요

## 9. Claude Code에서 이어서 할 첫 작업 (제안)

```
packages/jari/src/parser.ts의 TODO(M1) loadResumeModel(contentDir)을 구현해줘.
content/resume 디렉토리 전체(basics, experience/*, projects/*, education/*, skills.md,
positions/*)를 스캔해서 schema.ts 기준으로 검증하고, 하나의 canonical ResumeModel
객체로 조립해줘. 그 다음 vitest로 round-trip 테스트(model -> md 역변환 -> 재파싱 시
동등성)를 추가해줘. AGENTS.md의 규약을 따라줘.
```
