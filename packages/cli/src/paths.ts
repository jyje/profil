// packages/cli/src/paths.ts

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_NAME, CONFIG_FILENAME, ENV_PREFIX } from "./app.js";

/** 이 패키지의 루트 (templates/ 가 여기에 있다) */
// 컴파일 후 이 파일은 dist/paths.js 이므로 ".." = packages/cli
export const CLI_PKG_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const TEMPLATES_DIR = join(CLI_PKG_ROOT, "templates");

export const CLI_VERSION: string = JSON.parse(
  readFileSync(join(CLI_PKG_ROOT, "package.json"), "utf-8"),
).version;

/**
 * 개발 버전 여부. 개발 버전은 실사용 데이터를 오염시키지 않도록
 * 별도 홈(~/.<앱이름>-dev)을 쓴다.
 *
 * 판정 순서:
 *   1. PROFIL_DEV 환경변수가 있으면 그 값을 따른다 ("0"/"false" = 릴리스 취급)
 *   2. NODE_ENV=development 이면 개발 버전
 *   3. 패키지 버전에 prerelease 태그(예: 0.1.0-dev.0)가 있으면 개발 버전
 */
export function isDevBuild(): boolean {
  const flag = process.env[`${ENV_PREFIX}_DEV`];
  if (flag !== undefined) return flag !== "0" && flag.toLowerCase() !== "false";
  if (process.env.NODE_ENV === "development") return true;
  return CLI_VERSION.includes("-");
}

/**
 * 사용자 데이터 홈. 전역 설치(로컬 하네스) 시 기본 프로젝트가 되는 곳.
 * macOS/Linux: ~/.profil, Windows: %USERPROFILE%\.profil
 * 개발 버전은 ~/.profil-dev. PROFIL_HOME 환경변수로 재정의할 수 있다.
 */
export function appHome(): string {
  const override = process.env[`${ENV_PREFIX}_HOME`];
  if (override) return override;
  return join(homedir(), `.${APP_NAME}${isDevBuild() ? "-dev" : ""}`);
}

/**
 * cwd에서 위로 올라가며 profil.config.yaml이 있는 디렉토리를 찾는다.
 * 없으면 null (init 전 상태).
 */
export function findProjectRoot(from: string = process.cwd()): string | null {
  let dir = from;
  const { root } = parse(dir);
  while (true) {
    if (existsSync(join(dir, CONFIG_FILENAME))) return dir;
    if (dir === root) return null;
    dir = dirname(dir);
  }
}

/**
 * 명령이 대상으로 삼을 프로젝트 루트를 결정한다.
 * 우선순위: --root 플래그 > cwd 상향 탐색 > ~/.profil (초기화된 경우)
 */
export function resolveProjectRoot(rootFlag?: string): string | null {
  if (rootFlag) {
    const dir = resolve(rootFlag);
    return existsSync(join(dir, CONFIG_FILENAME)) ? dir : null;
  }
  const local = findProjectRoot();
  if (local) return local;
  const home = appHome();
  return existsSync(join(home, CONFIG_FILENAME)) ? home : null;
}
