// src/config.ts — typed changelog configuration with defaults + merge utility

export interface ChangelogConfig {
  /** Ordered list of commit types to include; types not in this list go under "Other" */
  typeOrder: string[];
  /** Prefix to prepend to version numbers in headers (default: "v") */
  versionPrefix: string;
  /** Include breaking changes indicator in commit bullets (default: true) */
  includeBreaking: boolean;
  /** Include scope in commit bullets when present (default: true) */
  includeScopes: boolean;
}

export const defaultConfig: ChangelogConfig = {
  typeOrder: ["feat", "fix", "docs", "refactor", "perf", "test", "chore"],
  versionPrefix: "v",
  includeBreaking: true,
  includeScopes: true,
};

/**
 * Merge a partial config over a base config (default: {@link defaultConfig}).
 *
 * Returns a brand-new object; neither `partial` nor `base` is mutated.
 * Keys present in `partial` win; everything else falls back to `base`.
 */
export function mergeConfig(
  partial?: Partial<ChangelogConfig>,
  base?: ChangelogConfig,
): ChangelogConfig {
  return { ...(base ?? defaultConfig), ...(partial ?? {}) };
}
