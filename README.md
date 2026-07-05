# Madang (마당)

> AI가 관리하는 개인/조직 온라인 프레즌스: 포트폴리오 · 지식기반(Obsidian 연동) · 포지션별 이력서(PDF/Word/HTML)를 하나의 콘텐츠 소스에서.

마당은 한옥에서 손님을 맞이하고 물건을 펼쳐 보이는 열린 공간입니다. 이 프로젝트는 흩어져 있던
포트폴리오, 지식기반 블로그(Quartz류), 이력서 빌더를 **하나의 마당**으로 모읍니다.

- **단일 소스**: `content/` 아래 구조화된 마크다운이 진실의 원천(single source of truth)
- **다중 출력**: 웹 페이지, PDF, DOCX가 같은 데이터에서 파생
- **포지션 변형**: 지원하는 포지션마다 다른 이력서를 자동 조립
- **AI 하네스**: 콘텐츠 추가/수정, 빌드 검증, 링크 무결성 검사를 에이전트가 보조

## 모노레포 구조

```
madang/
├── AGENTS.md            # AI 에이전트(Claude Code 등) 작업 규약
├── design/
│   ├── tokens.yaml       # 색상/타이포/간격 — 단일 디자인 진실
│   └── Design.md         # 디자인 시스템 문서 (사람 + AI 겸용)
├── content/
│   ├── resume/           # 이력서 데이터 (구조화 마크다운)
│   │   ├── basics.md
│   │   ├── experience/*.md
│   │   ├── projects/*.md
│   │   ├── education/*.md
│   │   ├── skills.md
│   │   └── positions/*.md   # 포지션별 뷰 정의 (필터/정렬 규칙)
│   ├── portfolio/*.md    # 포트폴리오 항목 (jyje/profile 마이그레이션 대상)
│   └── notes/            # Obsidian vault (지식기반 탭, jyje/docs 마이그레이션 대상)
├── packages/
│   ├── jari/              # 이력서 엔진: parse → model → render(html/pdf/docx)
│   └── site/               # 웹 템플릿 (포트폴리오/지식기반/이력서 탭)
├── madang.config.yaml     # 언어, 탭, 배포 대상 설정
└── dist/                  # 빌드 산출물: {name}-{position}-{lang}.{pdf,docx}
```

## 왜 마크다운인가

이력서 데이터를 YAML 대신 **구조화 마크다운**으로 씁니다. frontmatter가 구조(회사명, 기간, 태그)를,
본문이 리치 텍스트(요약, 성과 불릿)를 담당해서 YAML과 1:1로 무손실 매핑됩니다. 동시에 Obsidian에서
properties 패널로 그대로 열어 편집할 수 있고, `[[위키링크]]`로 포트폴리오·지식기반과 자연스럽게
연결됩니다.

## 빠른 시작

```bash
git clone <this-repo> madang && cd madang
npm install
npm run dev        # 로컬 미리보기
npm run build       # HTML + PDF + DOCX 전체 매트릭스 빌드
```

## 로드맵

- **M1** — Jari 코어: md 파서, zod 스키마, canonical model, 기본 HTML 렌더러
- **M2** — 출력 매트릭스: PDF(Playwright), DOCX(Pandoc), CLI, CI 아티팩트
- **M3** — 포지션 변형 + AI 하네스: positions 뷰, 링크 무결성 검사, 에이전트 워크플로우
- **M4** — Madang 사이트 통합: 포트폴리오/지식기반 탭, 셀프호스팅/클라우드 배포

## 라이선스

MIT (design/tokens.yaml 및 본인 콘텐츠는 별도 라이선스 가능)
