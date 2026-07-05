// packages/cli/src/paths.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { appHome, isDevBuild, CLI_VERSION } from "./paths.js";

const SAVED = {
  home: process.env.PROFIL_HOME,
  dev: process.env.PROFIL_DEV,
  nodeEnv: process.env.NODE_ENV,
};

afterEach(() => {
  for (const [env, value] of [
    ["PROFIL_HOME", SAVED.home],
    ["PROFIL_DEV", SAVED.dev],
    ["NODE_ENV", SAVED.nodeEnv],
  ] as const) {
    if (value === undefined) delete process.env[env];
    else process.env[env] = value;
  }
});

describe("isDevBuild", () => {
  it("PROFIL_DEV takes precedence (0/false forces release)", () => {
    process.env.PROFIL_DEV = "1";
    expect(isDevBuild()).toBe(true);
    process.env.PROFIL_DEV = "0";
    expect(isDevBuild()).toBe(false);
    process.env.PROFIL_DEV = "false";
    expect(isDevBuild()).toBe(false);
  });

  it("is a dev build when NODE_ENV=development", () => {
    delete process.env.PROFIL_DEV;
    process.env.NODE_ENV = "development";
    expect(isDevBuild()).toBe(true);
  });

  it("a prerelease version (e.g. 0.1.0-dev.0) is treated as a dev build", () => {
    delete process.env.PROFIL_DEV;
    delete process.env.NODE_ENV;
    expect(isDevBuild()).toBe(CLI_VERSION.includes("-"));
  });
});

describe("appHome", () => {
  it("dev builds use ~/.profil-dev, releases use ~/.profil", () => {
    delete process.env.PROFIL_HOME;
    process.env.PROFIL_DEV = "1";
    expect(appHome()).toBe(join(homedir(), ".profil-dev"));
    process.env.PROFIL_DEV = "0";
    expect(appHome()).toBe(join(homedir(), ".profil"));
  });

  it("PROFIL_HOME env var always wins", () => {
    process.env.PROFIL_HOME = "/tmp/custom-profil";
    process.env.PROFIL_DEV = "1"; // override wins even when dev
    expect(appHome()).toBe("/tmp/custom-profil");
  });
});
