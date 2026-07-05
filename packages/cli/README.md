# profil

Profil 프로젝트 내부 CLI. 완전 초기화(`init`), 정적 검사(`check`), 이력 관리
(`add`/`list`/`remove`), 산출물 정리(`clean`)를 제공합니다. npm에는 스코프 없는
`profil` 패키지로 배포되어 `npx profil`이 바로 동작합니다.

```bash
npx profil init            # 현재 디렉토리에 스캐폴드 + 검사
npx profil init --home     # 사용자 데이터 홈(~/.profil)에 초기화
npx profil init --force    # profil.config.yaml, content/resume, dist를 템플릿으로 재생성
npx profil check           # 정적 검사 (CI에서도 이걸 실행)
npx profil list [섹션]      # 이력 목록 (experience|projects|education|positions|skills)
npx profil add experience --company "ACME" --role "Engineer" --start 2024-01 \
    --end present --positions mlops,backend
npx profil add project --title "..." [--url ...] / add education / add position
npx profil remove experience/acme.md   # content/resume 기준 경로만 허용
npx profil clean [--deep]  # 빌드 산출물 정리 (--deep: node_modules까지)
```

## 데이터 홈 (`~/.profil`, 개발 버전은 `~/.profil-dev`)

로컬(전역) 설치 시 사용자 데이터는 `~/.profil/`에 쌓입니다 — macOS/Linux는
`$HOME/.profil`, Windows는 `%USERPROFILE%\.profil`.

**개발 버전은 `~/.profil-dev/`를 사용해** 실사용 데이터를 오염시키지 않습니다.
판정 순서 (`src/paths.ts`의 `isDevBuild`):

1. `PROFIL_DEV` 환경변수가 있으면 그 값 (`0`/`false`는 릴리스 강제)
2. `NODE_ENV=development`이면 개발 버전
3. 패키지 버전에 prerelease 태그가 있으면(예: `0.1.0-dev.0`) 개발 버전

`PROFIL_HOME` 환경변수는 위 판정과 무관하게 위치 자체를 재정의합니다.

모든 명령의 프로젝트 루트 해석 순서: `--root <dir>` 플래그 → 현재 디렉토리부터 상향
탐색(`profil.config.yaml` 기준) → `~/.profil` 폴백. 즉 리포 안에서는 리포를, 밖에서는
데이터 홈을 자동으로 대상 삼습니다.

`add`는 플래그를 스키마(zod)로 검증해 frontmatter를 만들고, 파일 생성 직후 `check`를
자동 실행합니다. `remove`도 삭제 후 `check`를 돌려 깨진 위키링크를 바로 알려줍니다.

## check가 검사하는 것

1. `profil.config.yaml` — zod 스키마 (`src/config.ts`가 단일 진실)
2. `content/resume/**/*.md` — frontmatter 스키마 (`@profil/jari`의 `loadResumeModel`)
3. 포지션 태그 무결성 — `positions:` 태그, `weight:` 키, config의 `resume.positions`가
   전부 `positions/*.md`의 slug와 매칭되는지
4. 위키링크 무결성 — `links:` frontmatter와 본문 `[[...]]`가 `content/` 아래 파일로
   해석되는지

모든 오류를 수집해 한 번에 보고하며, 하나라도 있으면 exit code 1.

## init의 안전 규칙

- 기존 파일이 있으면 거부 — `--force`를 명시해야 덮어씀 (비대화식, 프롬프트 없음)
- `--force`가 지우는 범위는 `profil.config.yaml`, `content/resume/`, `dist/` 뿐
- `content/notes/`(Obsidian vault)와 `content/portfolio/`는 사용자 데이터이므로
  **없을 때만 생성하고 절대 덮어쓰지 않음**

## 템플릿

`templates/`가 스캐폴드의 원본입니다. 샘플 콘텐츠를 바꾸려면 여기를 수정하세요
(리포 루트의 `content/`는 사용자 데이터라 init 템플릿이 아닙니다).

## 패키징 (bundle)

배포되는 실행 파일은 `dist/cli.js` 하나입니다 — esbuild로 `@profil/jari`,
`zod`, `gray-matter` 등을 전부 인라인 번들링해서, npm에 `@profil/jari`를 별도
발행하지 않고도 `profil` 하나만으로 설치·실행이 됩니다. 유일한 외부 런타임
의존성은 `yaml`(CJS 상호운용 문제로 `--external:yaml` 처리, `dependencies`에 유지)
뿐입니다.

```bash
npm run bundle --workspace=profil   # dist/cli.js 생성 (esbuild)
```

`npm publish`는 `prepublishOnly` 훅으로 이 스크립트를 자동 실행하므로 수동으로
번들링할 필요는 없습니다. `files` 필드가 `dist/cli.js`와 `templates/`만 포함하도록
제한하므로 `src/`, 테스트, 모노레포 워크스페이스 참조는 발행물에 섞이지 않습니다.

검증 방법(모노레포 밖 완전 격리 테스트):

```bash
cd packages/cli && npm pack
npm install -g ./profil-<version>.tgz
profil --version && profil init   # 임시 디렉토리에서
npm uninstall -g profil
```
