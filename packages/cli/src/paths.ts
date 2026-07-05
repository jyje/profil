// packages/cli/src/paths.ts

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_FILENAME } from "./config.js";

/** 이 패키지의 루트 (templates/ 가 여기에 있다) */
// 컴파일 후 이 파일은 dist/paths.js 이므로 ".." = packages/cli
export const CLI_PKG_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const TEMPLATES_DIR = join(CLI_PKG_ROOT, "templates");

/**
 * 사용자 데이터 홈. 전역 설치(로컬 하네스) 시 기본 프로젝트가 되는 곳.
 * macOS/Linux: ~/.madang, Windows: %USERPROFILE%\.madang
 * MADANG_HOME 환경변수로 재정의할 수 있다.
 */
export function madangHome(): string {
  return process.env.MADANG_HOME ?? join(homedir(), ".madang");
}

/**
 * cwd에서 위로 올라가며 madang.config.yaml이 있는 디렉토리를 찾는다.
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
 * 우선순위: --root 플래그 > cwd 상향 탐색 > ~/.madang (초기화된 경우)
 */
export function resolveProjectRoot(rootFlag?: string): string | null {
  if (rootFlag) {
    const dir = resolve(rootFlag);
    return existsSync(join(dir, CONFIG_FILENAME)) ? dir : null;
  }
  const local = findProjectRoot();
  if (local) return local;
  const home = madangHome();
  return existsSync(join(home, CONFIG_FILENAME)) ? home : null;
}
