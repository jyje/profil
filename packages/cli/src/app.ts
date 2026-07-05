// packages/cli/src/app.ts
//
// Single source of truth for the app name. Changing it here and in
// package.json's "bin" is enough to update the config filename, the data
// home (~/.<name>), and the env var prefix (<name>_HOME, etc.) together.

export const APP_NAME = "profil";

export const CONFIG_FILENAME = `${APP_NAME}.config.yaml`;

/** Env var prefix: PROFIL_HOME, PROFIL_DEV */
export const ENV_PREFIX = APP_NAME.toUpperCase();
