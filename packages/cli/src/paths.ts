// packages/cli/src/paths.ts

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_NAME, CONFIG_FILENAME, ENV_PREFIX } from "./app.js";

/** This package's root (templates/ lives here) */
// After compilation this file is dist/paths.js, so ".." = packages/cli
export const CLI_PKG_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const TEMPLATES_DIR = join(CLI_PKG_ROOT, "templates");

export const CLI_VERSION: string = JSON.parse(
  readFileSync(join(CLI_PKG_ROOT, "package.json"), "utf-8"),
).version;

/**
 * Whether this is a dev build. Dev builds use a separate home
 * (~/.<app-name>-dev) so they never touch real user data.
 *
 * Resolution order:
 *   1. PROFIL_DEV env var, if set ("0"/"false" forces release mode)
 *   2. dev if NODE_ENV=development
 *   3. dev if the package version has a prerelease tag (e.g. 0.1.0-dev.0)
 */
export function isDevBuild(): boolean {
  const flag = process.env[`${ENV_PREFIX}_DEV`];
  if (flag !== undefined) return flag !== "0" && flag.toLowerCase() !== "false";
  if (process.env.NODE_ENV === "development") return true;
  return CLI_VERSION.includes("-");
}

/**
 * The user data home — the default project when installed globally (as a
 * local harness). macOS/Linux: ~/.profil, Windows: %USERPROFILE%\.profil
 * Dev builds use ~/.profil-dev. Override with the PROFIL_HOME env var.
 */
export function appHome(): string {
  const override = process.env[`${ENV_PREFIX}_HOME`];
  if (override) return override;
  return join(homedir(), `.${APP_NAME}${isDevBuild() ? "-dev" : ""}`);
}

/**
 * Walks up from cwd looking for a directory containing profil.config.yaml.
 * Returns null if none is found (pre-init state).
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
 * Determines the project root a command should target.
 * Priority: --root flag > walking up from cwd > ~/.profil (if initialized)
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
