// packages/cli/src/paths.ts

import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

/** 이 패키지의 루트 (templates/ 가 여기에 있다) */
// 컴파일 후 이 파일은 dist/paths.js 이므로 ".." = packages/cli
export const CLI_PKG_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const TEMPLATES_DIR = join(CLI_PKG_ROOT, "templates");

/**
 * cwd에서 위로 올라가며 madang.config.yaml이 있는 디렉토리를 찾는다.
 * 없으면 null (init 전 상태).
 */
export function findProjectRoot(from: string = process.cwd()): string | null {
  let dir = from;
  const { root } = parse(dir);
  while (true) {
    if (existsSync(join(dir, "madang.config.yaml"))) return dir;
    if (dir === root) return null;
    dir = dirname(dir);
  }
}
