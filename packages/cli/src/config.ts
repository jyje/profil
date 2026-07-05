// packages/cli/src/config.ts
//
// profil.config.yaml 로더 + zod 스키마. 이 스키마가 설정 구조의 단일 진실이다.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { ContentIssue } from "@profil/jari";

export { CONFIG_FILENAME } from "./app.js";
import { CONFIG_FILENAME } from "./app.js";

const TabSchema = z.object({
  id: z.string(),
  label: z.record(z.string(), z.string()),
  enabled: z.boolean().default(true),
  renderer: z.enum(["quartz-embed", "native"]).optional(),
});

export const MadangConfigSchema = z
  .object({
    site: z.object({
      name: z.string(),
      languages: z.array(z.string()).min(1),
      default_language: z.string(),
      tabs: z.array(TabSchema).default([]),
    }),
    resume: z.object({
      positions: z.array(z.string()).min(1),
      formats: z.array(z.enum(["html", "pdf", "docx"])).min(1),
    }),
    deploy: z.object({
      target: z.enum(["self-hosted", "github-pages", "vercel", "cloudflare-pages"]),
    }),
  })
  .superRefine((cfg, ctx) => {
    if (!cfg.site.languages.includes(cfg.site.default_language)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["site", "default_language"],
        message: `site.languages에 없는 언어입니다: "${cfg.site.default_language}"`,
      });
    }
  });

export type MadangConfig = z.infer<typeof MadangConfigSchema>;

export interface LoadConfigResult {
  config: MadangConfig | null;
  errors: ContentIssue[];
}

export async function loadConfig(projectRoot: string): Promise<LoadConfigResult> {
  const file = CONFIG_FILENAME;
  const path = join(projectRoot, file);

  if (!existsSync(path)) {
    return { config: null, errors: [{ file, message: "설정 파일이 없습니다" }] };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(await readFile(path, "utf-8"));
  } catch (e) {
    return { config: null, errors: [{ file, message: `YAML 파싱 실패: ${(e as Error).message}` }] };
  }

  const result = MadangConfigSchema.safeParse(parsed);
  if (!result.success) {
    return {
      config: null,
      errors: result.error.issues.map((issue) => ({
        file,
        message: `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`,
      })),
    };
  }

  return { config: result.data, errors: [] };
}
