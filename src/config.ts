export interface ChangelogConfig {
  /** Maps commit type → section title. */
  sections?: Record<string, string>;
  /** Section title for unmapped commit types. */
  defaultSection?: string;
  /** Section title for breaking changes. */
  breakingLabel?: string;
  /** Prefix for version in headers. */
  versionPrefix?: string;
  /** Allowlist of commit types to include. Empty means include all. */
  includeTypes?: string[];
  /** Denylist of scopes to exclude. Empty means exclude none. */
  excludeScopes?: string[];
}

export const defaultConfig: Required<ChangelogConfig> = {
  sections: {
    feat: "Added",
    fix: "Fixed",
    refactor: "Changed",
    perf: "Changed",
    docs: "Changed",
    deprecated: "Removed",
    security: "Security",
  },
  defaultSection: "Other",
  breakingLabel: "⚠ Breaking Changes",
  versionPrefix: "v",
  includeTypes: [],
  excludeScopes: [],
};

/**
 * Deep-merges a partial config over the defaults.
 * If `partial.sections` is provided it is merged (not replaced) with
 * `defaultConfig.sections`.
 */
export function mergeConfig(
  partial?: Partial<ChangelogConfig>
): Required<ChangelogConfig> {
  if (!partial) {
    return { ...defaultConfig, sections: { ...defaultConfig.sections } };
  }

  const sections = partial.sections
    ? { ...defaultConfig.sections, ...partial.sections }
    : { ...defaultConfig.sections };

  return {
    sections,
    defaultSection:
      partial.defaultSection !== undefined
        ? partial.defaultSection
        : defaultConfig.defaultSection,
    breakingLabel:
      partial.breakingLabel !== undefined
        ? partial.breakingLabel
        : defaultConfig.breakingLabel,
    versionPrefix:
      partial.versionPrefix !== undefined
        ? partial.versionPrefix
        : defaultConfig.versionPrefix,
    includeTypes:
      partial.includeTypes !== undefined
        ? partial.includeTypes
        : [...defaultConfig.includeTypes],
    excludeScopes:
      partial.excludeScopes !== undefined
        ? partial.excludeScopes
        : [...defaultConfig.excludeScopes],
  };
}
