# @madang/cli

Madang 프로젝트 내부 CLI. 완전 초기화(`init`), 정적 검사(`check`), 이력 관리
(`add`/`list`/`remove`), 산출물 정리(`clean`)를 제공합니다.

```bash
npx madang init            # 현재 디렉토리에 스캐폴드 + 검사
npx madang init --home     # 사용자 데이터 홈(~/.madang)에 초기화
npx madang init --force    # madang.config.yaml, content/resume, dist를 템플릿으로 재생성
npx madang check           # 정적 검사 (CI에서도 이걸 실행)
npx madang list [섹션]      # 이력 목록 (experience|projects|education|positions|skills)
npx madang add experience --company "ACME" --role "Engineer" --start 2024-01 \
    --end present --positions mlops,backend
npx madang add project --title "..." [--url ...] / add education / add position
npx madang remove experience/acme.md   # content/resume 기준 경로만 허용
npx madang clean [--deep]  # 빌드 산출물 정리 (--deep: node_modules까지)
```

## 데이터 홈 (`~/.madang`)

로컬(전역) 설치 시 사용자 데이터는 `~/.madang/`에 쌓입니다 — macOS/Linux는
`$HOME/.madang`, Windows는 `%USERPROFILE%\.madang`. `MADANG_HOME` 환경변수로 위치를
재정의할 수 있습니다.

모든 명령의 프로젝트 루트 해석 순서: `--root <dir>` 플래그 → 현재 디렉토리부터 상향
탐색(`madang.config.yaml` 기준) → `~/.madang` 폴백. 즉 리포 안에서는 리포를, 밖에서는
데이터 홈을 자동으로 대상 삼습니다.

`add`는 플래그를 스키마(zod)로 검증해 frontmatter를 만들고, 파일 생성 직후 `check`를
자동 실행합니다. `remove`도 삭제 후 `check`를 돌려 깨진 위키링크를 바로 알려줍니다.

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
