// packages/jari/src/design.ts
//
// Loads design/tokens.yaml — the single source of design truth — with
// defaults for every field, so rendering works even when the file is
// missing or partial. Unknown keys (e.g. the docx: section, which only the
// M2 reference.docx generator cares about) are ignored here.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { ContentIssue } from "./loader.js";

const DesignTokensSchema = z.object({
  color: z
    .object({
      background: z.string().default("#ffffff"),
      text: z.string().default("#1a1a1a"),
      text_muted: z.string().default("#5c5c5c"),
      accent: z.string().default("#2f6f4f"),
      border: z.string().default("#e0e0e0"),
    })
    .default({}),
  typography: z
    .object({
      font_body: z
        .string()
        .default("'Noto Sans KR', 'Pretendard', Helvetica, Arial, sans-serif"),
      font_heading: z
        .string()
        .default("'Noto Serif KR', 'Pretendard', Helvetica, Arial, sans-serif"),
      line_height: z
        .object({
          body: z.number().default(1.6),
          heading: z.number().default(1.3),
        })
        .default({}),
    })
    .default({}),
  layout: z
    .object({
      max_width_content: z.string().default("720px"),
    })
    .default({}),
  print: z
    .object({
      page_size: z.string().default("A4"),
      margin: z
        .object({
          top: z.string().default("8mm"),
          right: z.string().default("8mm"),
          bottom: z.string().default("8mm"),
          left: z.string().default("8mm"),
        })
        .default({}),
    })
    .default({}),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

export const DEFAULT_TOKENS: DesignTokens = DesignTokensSchema.parse({});

export interface LoadTokensResult {
  tokens: DesignTokens;
  warnings: ContentIssue[];
}

/**
 * Reads <projectRoot>/design/tokens.yaml. A missing file silently yields the
 * defaults; a malformed file also yields the defaults but with a warning, so
 * a broken tokens file degrades the design instead of blocking a build.
 */
export function loadDesignTokens(projectRoot: string): LoadTokensResult {
  const file = "design/tokens.yaml";
  const path = join(projectRoot, file);

  if (!existsSync(path)) {
    return { tokens: DEFAULT_TOKENS, warnings: [] };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(readFileSync(path, "utf-8"));
  } catch (e) {
    return {
      tokens: DEFAULT_TOKENS,
      warnings: [
        { file, message: `YAML parse failed, using default tokens: ${(e as Error).message}` },
      ],
    };
  }

  const result = DesignTokensSchema.safeParse(parsed ?? {});
  if (!result.success) {
    return {
      tokens: DEFAULT_TOKENS,
      warnings: result.error.issues.map((issue) => ({
        file,
        message: `${issue.path.join(".") || "(root)"}: ${issue.message} — using default tokens`,
      })),
    };
  }

  return { tokens: result.data, warnings: [] };
}
