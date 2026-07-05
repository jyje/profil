#!/usr/bin/env node
// packages/cli/src/index.ts — madang CLI 진입점

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CLI_PKG_ROOT, findProjectRoot } from "./paths.js";
import { runInit } from "./commands/init.js";
import { runCheck } from "./commands/check.js";
import { runClean } from "./commands/clean.js";
import { bold, dim, red } from "./report.js";

const USAGE = `${bold("madang")} — Madang 프로젝트 내부 CLI

사용법:
  madang init [--force]   현재 디렉토리에 프로젝트를 완전 초기화 (템플릿 스캐폴드 + 검사)
                          --force: madang.config.yaml, content/resume, dist를 지우고 재생성
                          (content/notes, content/portfolio는 절대 덮어쓰지 않음)
  madang check            정적 검사: 설정/콘텐츠 스키마, 포지션 태그·위키링크 무결성
  madang clean [--deep]   dist/, packages/*/dist 삭제 (--deep: node_modules까지)

옵션:
  -h, --help              도움말
  -v, --version           버전
`;

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      force: { type: "boolean", default: false },
      deep: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  });

  if (values.version) {
    const pkg = JSON.parse(await readFile(join(CLI_PKG_ROOT, "package.json"), "utf-8"));
    console.log(pkg.version);
    return 0;
  }

  const command = positionals[0];
  if (values.help || command === undefined || command === "help") {
    console.log(USAGE);
    return command === undefined && !values.help ? 1 : 0;
  }

  switch (command) {
    case "init":
      return (await runInit(process.cwd(), values.force)) ? 0 : 1;

    case "check": {
      const root = findProjectRoot();
      if (!root) {
        console.error(red("madang 프로젝트를 찾을 수 없습니다 (madang.config.yaml 없음)."));
        console.error(dim("새 프로젝트라면 `madang init`을 먼저 실행하세요."));
        return 1;
      }
      return (await runCheck(root)) ? 0 : 1;
    }

    case "clean": {
      const root = findProjectRoot();
      if (!root) {
        console.error(red("madang 프로젝트를 찾을 수 없습니다 (madang.config.yaml 없음)."));
        return 1;
      }
      return (await runClean(root, values.deep)) ? 0 : 1;
    }

    default:
      console.error(red(`알 수 없는 명령: ${command}`));
      console.log(USAGE);
      return 1;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e) => {
    console.error(red(`오류: ${(e as Error).stack ?? e}`));
    process.exitCode = 1;
  },
);
