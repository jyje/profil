#!/usr/bin/env node
// packages/cli/src/index.ts — madang CLI 진입점

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CLI_PKG_ROOT, madangHome, resolveProjectRoot } from "./paths.js";
import { runInit } from "./commands/init.js";
import { runCheck } from "./commands/check.js";
import { runClean } from "./commands/clean.js";
import { runAdd, ADD_TYPES, type AddType } from "./commands/add.js";
import { runList } from "./commands/list.js";
import { runRemove } from "./commands/remove.js";
import { bold, dim, red } from "./report.js";

// `madang list | head` 처럼 파이프가 먼저 닫혀도 크래시하지 않도록
for (const stream of [process.stdout, process.stderr]) {
  stream.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EPIPE") process.exit(0);
    throw e;
  });
}

const USAGE = `${bold("madang")} — Madang 프로젝트 내부 CLI

사용법:
  madang init [--force] [--home]
      프로젝트 완전 초기화 (템플릿 스캐폴드 + 검사). 기본은 현재 디렉토리,
      --home이면 사용자 데이터 홈(~/.madang, MADANG_HOME으로 재정의 가능)에 초기화.
      --force: madang.config.yaml, content/resume, dist를 지우고 재생성
      (content/notes, content/portfolio는 절대 덮어쓰지 않음)

  madang check              정적 검사: 설정/콘텐츠 스키마, 포지션 태그·위키링크 무결성
  madang list [섹션]         이력 목록 (experience|projects|education|positions|skills)
  madang add <type> [플래그]  이력 항목 추가 (experience|project|education|position)
      공통:      [--lang ko|en] [--slug <파일명>] [--positions mlops,backend]
      experience: --company --role --start YYYY-MM [--end YYYY-MM|present] [--location]
      project:    --title [--role] [--url] [--start] [--end]
      education:  --institution --start [--end] [--degree]
      position:   --title [--slug] [--headline]
  madang remove <경로>        이력 항목 삭제 (content/resume 기준, 예: experience/acme.md)
  madang clean [--deep]      dist/, packages/*/dist 삭제 (--deep: node_modules까지)

공통 옵션:
  --root <dir>              대상 프로젝트 루트를 명시 (기본: cwd 상향 탐색 → ~/.madang)
  -h, --help                도움말
  -v, --version             버전
`;

function requireRoot(rootFlag?: string): string | null {
  const root = resolveProjectRoot(rootFlag);
  if (!root) {
    console.error(red("madang 프로젝트를 찾을 수 없습니다 (madang.config.yaml 없음)."));
    console.error(dim(`탐색 순서: --root > 현재 디렉토리부터 상향 > ${madangHome()}`));
    console.error(dim("새로 시작하려면 `madang init`(현재 위치) 또는 `madang init --home`을 실행하세요."));
  }
  return root;
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      force: { type: "boolean", default: false },
      deep: { type: "boolean", default: false },
      home: { type: "boolean", default: false },
      root: { type: "string" },
      lang: { type: "string" },
      slug: { type: "string" },
      company: { type: "string" },
      role: { type: "string" },
      title: { type: "string" },
      institution: { type: "string" },
      degree: { type: "string" },
      start: { type: "string" },
      end: { type: "string" },
      location: { type: "string" },
      positions: { type: "string" },
      url: { type: "string" },
      headline: { type: "string" },
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
    case "init": {
      const target = values.home ? madangHome() : (values.root ?? process.cwd());
      return (await runInit(target, values.force)) ? 0 : 1;
    }

    case "check": {
      const root = requireRoot(values.root);
      return root && (await runCheck(root)) ? 0 : 1;
    }

    case "list": {
      const root = requireRoot(values.root);
      return root && (await runList(root, positionals[1])) ? 0 : 1;
    }

    case "add": {
      const type = positionals[1];
      if (type === undefined || !ADD_TYPES.includes(type as AddType)) {
        console.error(red(`추가할 항목 타입을 지정하세요 (가능: ${ADD_TYPES.join(", ")})`));
        return 1;
      }
      const root = requireRoot(values.root);
      return root && (await runAdd(root, type as AddType, values)) ? 0 : 1;
    }

    case "remove": {
      const relPath = positionals[1];
      if (relPath === undefined) {
        console.error(red("삭제할 경로를 지정하세요 (content/resume 기준, 예: experience/acme.md)"));
        return 1;
      }
      const root = requireRoot(values.root);
      return root && (await runRemove(root, relPath)) ? 0 : 1;
    }

    case "clean": {
      const root = requireRoot(values.root);
      return root && (await runClean(root, values.deep)) ? 0 : 1;
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
