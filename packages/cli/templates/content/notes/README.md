# content/notes/ — 지식기반 (Obsidian Vault)

이 디렉토리를 Obsidian vault로 여세요 (Obsidian에서 "Open folder as vault"로
`content/notes/`를 직접 지정). jyje/docs 마이그레이션 대상입니다.

## 규약

- 파일명이 곧 퍼머링크 slug가 됩니다. `[[위키링크]]`는 파일명 기준으로 해석됩니다.
- 파일명을 변경하면 링크가 깨집니다 — 변경이 필요하면 리다이렉트 맵을
  `content/notes/_redirects.yaml`(M4에서 도입)에 추가하세요.
- 웹 렌더링 방식은 M4에서 결정: 초기에는 Quartz를 `/notes` 서브패스로 별도 빌드해
  임베드하고, 이후 자체 렌더러(Astro + remark-wiki-link 등)로 교체하는 것을 목표로 합니다.

## 포트폴리오/이력서와의 연결

`content/resume/**/*.md`나 `content/portfolio/**/*.md`의 `links:` 필드에서 이 vault의
노트를 위키링크로 참조할 수 있습니다. 빌드 시 대상 노트의 존재 여부를 검증합니다.
