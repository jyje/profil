# @madang/cli

Madang 프로젝트 내부 CLI. 완전 초기화(`init`), 정적 검사(`check`), 산출물 정리(`clean`)를
제공합니다.

```bash
# 리포 루트에서 (node_modules/.bin에 madang이 링크됨)
npx madang init            # 새 디렉토리에 스캐폴드 + 검사
npx madang init --force    # madang.config.yaml, content/resume, dist를 템플릿으로 재생성
npx madang check           # 정적 검사 (CI에서도 이걸 실행)
npx madang clean [--deep]  # 빌드 산출물 정리 (--deep: node_modules까지)
```

## check가 검사하는 것

1. `madang.config.yaml` — zod 스키마 (`src/config.ts`가 단일 진실)
2. `content/resume/**/*.md` — frontmatter 스키마 (`@madang/jari`의 `loadResumeModel`)
3. 포지션 태그 무결성 — `positions:` 태그, `weight:` 키, config의 `resume.positions`가
   전부 `positions/*.md`의 slug와 매칭되는지
4. 위키링크 무결성 — `links:` frontmatter와 본문 `[[...]]`가 `content/` 아래 파일로
   해석되는지

모든 오류를 수집해 한 번에 보고하며, 하나라도 있으면 exit code 1.

## init의 안전 규칙

- 기존 파일이 있으면 거부 — `--force`를 명시해야 덮어씀 (비대화식, 프롬프트 없음)
- `--force`가 지우는 범위는 `madang.config.yaml`, `content/resume/`, `dist/` 뿐
- `content/notes/`(Obsidian vault)와 `content/portfolio/`는 사용자 데이터이므로
  **없을 때만 생성하고 절대 덮어쓰지 않음**

## 템플릿

`templates/`가 스캐폴드의 원본입니다. 샘플 콘텐츠를 바꾸려면 여기를 수정하세요
(리포 루트의 `content/`는 사용자 데이터라 init 템플릿이 아닙니다).
