// packages/cli/src/app.ts
//
// 앱 이름의 단일 진실. 이름을 바꾸면 여기와 package.json(bin)만 고치면
// config 파일명, 데이터 홈(~/.<이름>), 환경변수(<이름>_HOME 등)가 함께 바뀐다.

export const APP_NAME = "profil";

export const CONFIG_FILENAME = `${APP_NAME}.config.yaml`;

/** 환경변수 접두어: PROFIL_HOME, PROFIL_DEV */
export const ENV_PREFIX = APP_NAME.toUpperCase();
