# content/portfolio/ — 포트폴리오 항목

jyje/profile의 `_data/portfolio-*.yml` 마이그레이션 대상입니다. 항목당 파일 하나 규칙을
따릅니다 (스키마는 M1~M2 사이에 `packages/jari/src/schema.ts`에 `ProjectSchema`를
확장하거나 별도 `PortfolioSchema`로 정의).

`content/resume/projects/*.md`와의 차이: resume/projects는 이력서에 노출되는 짧은 항목,
portfolio는 웹 포트폴리오 탭에 노출되는 상세 항목(이미지, 긴 설명 포함)입니다. 같은
프로젝트를 양쪽에서 참조하려면 `links:`로 서로 연결하세요.
