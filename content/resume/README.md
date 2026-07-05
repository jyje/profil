# content/resume/ 작성 규약

이 디렉토리의 모든 파일은 `packages/jari/src/schema.ts`의 zod 스키마를 따르는 frontmatter를
가져야 합니다. 항목당 파일 하나가 규칙입니다.

## 매핑 규칙 (md ↔ 데이터)

- frontmatter → 구조 필드 (회사명, 기간, 태그 등) — 그대로 1:1
- 본문 첫 문단 → `summary`
- 본문 불릿 리스트(`- ` 또는 `* `) → `highlights[]`

이 규칙을 지키면 md 파일이 YAML과 무손실로 상호 변환됩니다. 자유 산문이나 중첩 구조,
JSX/MDX 컴포넌트는 이 디렉토리에서 사용하지 않습니다 — PDF/DOCX 렌더러가 이해하지 못합니다.

## 언어

동일 항목의 다른 언어 버전은 파일명 접미사로 구분합니다: `maxst.md`(ko 기본) /
`maxst.en.md`. `lang` frontmatter 필드는 필수입니다.

## 포지션 태그

`positions: [mlops, backend]` 처럼 `content/resume/positions/*.md`에 정의된 slug를
참조합니다. 새 포지션을 지원하려면 `positions/` 아래 새 파일을 추가하세요 — 기존 경력/프로젝트
파일을 건드릴 필요는 없습니다 (해당 항목에 태그를 추가하는 것만 필요).

## 지식기반/포트폴리오 연결

`links: ["[[projects/cluster]]"]` 처럼 위키링크로 `content/notes/`나 `content/portfolio/`의
항목을 참조할 수 있습니다. 빌드 시 대상이 존재하는지 검증합니다.
