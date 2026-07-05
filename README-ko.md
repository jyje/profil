<div align="center">

# jyje/profil

AI가 관리하는 개인/조직 온라인 프레즌스 —<br/>
포트폴리오 · 지식기반(Obsidian) · 포지션별 이력서(HTML/PDF/DOCX)를 하나의 콘텐츠 소스에서

[![check](https://github.com/jyje/profil/actions/workflows/check.yaml/badge.svg)](https://github.com/jyje/profil/actions/workflows/check.yaml)
[![GitHub stars](https://img.shields.io/github/stars/jyje/profil?style=social)](https://github.com/jyje/profil/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English](README.md) / [한국어](README-ko.md)

</div>

이 프로젝트가 여러분만의 프로필을 짓는 데 도움이 됐다면 ⭐ 하나 부탁드려요!

## 개요

**Profil**은 '프로필'의 유럽식 철자입니다 — 세상에 보여주는 모든 것을 하나의 콘텐츠
소스로 움직인다는 뜻을 담았습니다. 흩어져 있던 포트폴리오, 지식기반 블로그(Quartz류),
이력서 빌더를 한곳에 모읍니다.

- **단일 소스**: `content/` 아래 구조화된 마크다운이 진실의 원천(single source of truth)
- **다중 출력**: 웹 페이지, PDF, DOCX가 같은 데이터에서 파생
- **포지션 변형**: 지원하는 포지션마다 다른 이력서를 자동 조립
- **AI 하네스**: 콘텐츠 추가/수정, 빌드 검증, 링크 무결성 검사를 에이전트가 보조

## 모노레포 구조

```
profil/
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
│   ├── portfolio/*.md    # 포트폴리오 항목
│   └── notes/            # Obsidian vault (지식기반 탭)
├── packages/
│   ├── jari/              # 이력서 엔진: parse → model → render(html/pdf/docx)
│   ├── cli/               # 내부 CLI: profil init / check / add / list / remove / clean
│   └── site/               # 웹 템플릿 (포트폴리오/지식기반/이력서 탭)
├── profil.config.yaml     # 언어, 탭, 배포 대상 설정
└── dist/                  # 빌드 산출물: {name}-{position}-{lang}.{pdf,docx}
```

## 왜 구조화 마크다운인가

이력서 데이터를 YAML 대신 **구조화 마크다운**으로 씁니다. frontmatter가 구조(회사명,
기간, 태그)를, 본문이 리치 텍스트(요약, 성과 불릿)를 담당해서 YAML과 1:1로 무손실
매핑됩니다. 동시에 Obsidian에서 properties 패널로 그대로 열어 편집할 수 있고,
`[[위키링크]]`로 포트폴리오·지식기반과 자연스럽게 연결됩니다.

## 빠른 시작

```bash
git clone https://github.com/jyje/profil.git && cd profil
npm install         # 설치 시 packages/{jari,cli}가 자동 빌드됨 (prepare)
npm run check       # 정적 테스트: tsc 빌드 + vitest + profil check
npm run dev        # 로컬 미리보기 (M4)
npm run build       # HTML + PDF + DOCX 전체 매트릭스 빌드 (M2)
```

## 내부 CLI (`profil`)

```bash
npx profil init            # 현재 디렉토리에 프로젝트 완전 초기화 (템플릿 스캐폴드 + 검사)
npx profil init --home     # 사용자 데이터 홈(~/.profil)에 초기화
npx profil init --force    # profil.config.yaml, content/resume, dist를 템플릿으로 재생성
                           # (content/notes, content/portfolio는 절대 덮어쓰지 않음)
npx profil check           # 정적 검사: 설정/콘텐츠 스키마, 포지션 태그·위키링크 무결성
npx profil list [섹션]      # 이력 목록 (experience|projects|education|positions|skills)
npx profil add experience --company "ACME" --role "Engineer" --start 2024-01 --positions mlops
npx profil remove experience/acme.md   # 경로는 content/resume 기준
npx profil clean [--deep]  # 빌드 산출물 정리 (--deep: node_modules까지)
```

**데이터 홈** — 로컬 도구로 설치하면 사용자 데이터는 `~/.profil/`에 쌓입니다
(macOS/Linux는 `$HOME/.profil`, Windows는 `%USERPROFILE%\.profil`). **개발 버전은
`~/.profil-dev/`를 사용해** 실사용 데이터를 건드리지 않습니다 — 버전에 prerelease
태그(예: `0.1.0-dev.0`)가 있거나, `NODE_ENV=development`이거나, `PROFIL_DEV=1`이면
개발 버전으로 판정합니다(`PROFIL_DEV=0`은 릴리스 강제). `PROFIL_HOME`으로 위치 자체를
재정의할 수 있습니다. 모든 명령의 프로젝트 루트 해석 순서는 `--root <dir>` 플래그 →
현재 디렉토리부터 상향 탐색 → 데이터 홈 폴백입니다.

CI(`.github/workflows/check.yaml`)도 같은 단일 진입점인 `npm run check`를 실행합니다.
자세한 검사 항목은 `packages/cli/README.md`를 참고하세요.

## 로드맵

- **M1** — Jari 코어: md 파서, zod 스키마, canonical model, 기본 HTML 렌더러
- **M2** — 출력 매트릭스: PDF(Playwright), DOCX(Pandoc), 빌드 CLI, CI 아티팩트
- **M3** — 포지션 변형 + AI 하네스: positions 뷰, 링크 무결성 검사, 에이전트 워크플로우
- **M4** — 사이트 통합: 포트폴리오/지식기반 탭, 셀프호스팅/클라우드 배포

## 라이선스

MIT (디자인 토큰 및 본인 콘텐츠는 별도 라이선스 가능)
