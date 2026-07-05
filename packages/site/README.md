# @profil/site

M4에서 구현 시작. 결정 필요 항목:

- **프레임워크**: Astro(콘텐츠 사이트에 적합, wikilink 플러그인 생태계) vs Jekyll
  (jyje/profile의 hydejack 기반과 직접 호환 — 마이그레이션 비용 최소화)
- **지식기반 탭 초기 구현**: Quartz를 `/notes` 서브패스로 별도 빌드해 정적 임베드
  (빠른 시작) → 이후 자체 렌더러(remark-wiki-link + backlink 플러그인)로 교체
- **이력서 탭**: `@profil/jari`가 생성한 HTML을 그대로 라우트에 마운트, 다운로드 버튼은
  `dist/`의 PDF/DOCX 링크

## 참고

jyje/profile의 `_layouts/`, `_includes/`, `_sass/` 구조를 오마주 대상으로 참고할 것 —
사이드바 커버 페이지, 반응형 레이아웃 패턴이 이미 검증되어 있음.
