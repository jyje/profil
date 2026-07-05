#!/usr/bin/env node
// packages/cli/src/index.ts — profil CLI entry point

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CLI_PKG_ROOT, appHome, resolveProjectRoot } from "./paths.js";
import { runInit } from "./commands/init.js";
import { runCheck } from "./commands/check.js";
import { runClean } from "./commands/clean.js";
import { runAdd, ADD_TYPES, type AddType } from "./commands/add.js";
import { runBuild } from "./commands/build.js";
import { runList } from "./commands/list.js";
import { runRemove } from "./commands/remove.js";
import { bold, dim, red } from "./report.js";

// So a closed-early pipe (e.g. `profil list | head`) doesn't crash the process
for (const stream of [process.stdout, process.stderr]) {
  stream.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EPIPE") process.exit(0);
    throw e;
  });
}

const USAGE = `${bold("profil")} — internal CLI for the Profil project

Usage:
  profil init [--force] [--home]
      Fully initialize a project (scaffold from templates + check). Defaults
      to the current directory; --home targets the user data home
      (~/.profil, overridable via PROFIL_HOME).
      --force: delete and regenerate profil.config.yaml, content/resume, dist
      (content/notes and content/portfolio are never overwritten)

  profil check              Static checks: config/content schemas, position tag and wikilink integrity
  profil build [flags]      Assemble and render per-position resumes into dist/
      [--position <slug>]   one position only (default: all in profil.config.yaml)
      [--lang ko|en]        one language only (default: languages the content has)
      [--format md,html]    output formats (default: config resume.formats; pdf/docx land in M2)
      [--out <dir>]         output directory relative to the project root (default: dist)
  profil list [section]     List resume entries (experience|projects|education|positions|skills)
  profil add <type> [flags]  Add a resume entry (experience|project|education|position)
      common:     [--lang ko|en] [--slug <filename>] [--positions mlops,backend]
      experience: --company --role --start YYYY-MM [--end YYYY-MM|present] [--location]
      project:    --title [--role] [--url] [--start] [--end]
      education:  --institution --start [--end] [--degree]
      position:   --title [--slug] [--headline]
  profil remove <path>       Remove a resume entry (relative to content/resume, e.g. experience/acme.md)
  profil clean [--deep]      Remove dist/, packages/*/dist (--deep: node_modules too)

Common options:
  --root <dir>              Explicit project root (default: walk up from cwd -> ~/.profil)
  -h, --help                Show help
  -v, --version             Show version
`;

function requireRoot(rootFlag?: string): string | null {
  const root = resolveProjectRoot(rootFlag);
  if (!root) {
    console.error(red("no profil project found (no profil.config.yaml)."));
    console.error(dim(`resolution order: --root > walking up from cwd > ${appHome()}`));
    console.error(dim("run `profil init` (here) or `profil init --home` to start a new one."));
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
      position: { type: "string" },
      format: { type: "string" },
      out: { type: "string" },
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
      const target = values.home ? appHome() : (values.root ?? process.cwd());
      return (await runInit(target, values.force)) ? 0 : 1;
    }

    case "check": {
      const root = requireRoot(values.root);
      return root && (await runCheck(root)) ? 0 : 1;
    }

    case "build": {
      const root = requireRoot(values.root);
      return root && (await runBuild(root, values)) ? 0 : 1;
    }

    case "list": {
      const root = requireRoot(values.root);
      return root && (await runList(root, positionals[1])) ? 0 : 1;
    }

    case "add": {
      const type = positionals[1];
      if (type === undefined || !ADD_TYPES.includes(type as AddType)) {
        console.error(red(`specify the entry type to add (one of: ${ADD_TYPES.join(", ")})`));
        return 1;
      }
      const root = requireRoot(values.root);
      return root && (await runAdd(root, type as AddType, values)) ? 0 : 1;
    }

    case "remove": {
      const relPath = positionals[1];
      if (relPath === undefined) {
        console.error(red("specify the path to remove (relative to content/resume, e.g. experience/acme.md)"));
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
      console.error(red(`unknown command: ${command}`));
      console.log(USAGE);
      return 1;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e) => {
    console.error(red(`error: ${(e as Error).stack ?? e}`));
    process.exitCode = 1;
  },
);
