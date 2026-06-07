// src/format-json.ts — JSON output formatter for changeloom
//
// Converts grouped conventional commits into a machine-readable JSON structure.

export interface CommitEntry {
  hash: string;
  subject: string;
  scope?: string;
}

export interface CommitGroup {
  type: string;
  label: string;
  commits: CommitEntry[];
}

export interface ChangelogJson {
  version?: string;
  groups: CommitGroup[];
}

/**
 * Convert an array of CommitGroups (and optional version) to the changeloom
 * JSON changelog shape.
 *
 * @param groups - Grouped commits, each with type, label, and commits array
 * @param version - Optional release version string (e.g. "1.2.3")
 * @returns ChangelogJson object ready for JSON.stringify()
 */
export function toJson(groups: CommitGroup[], version?: string): ChangelogJson {
  const result: ChangelogJson = {
    groups: groups.map((g) => ({
      type: g.type,
      label: g.label,
      commits: g.commits.map((c) => {
        const entry: CommitEntry = { hash: c.hash, subject: c.subject };
        if (c.scope != null) entry.scope = c.scope;
        return entry;
      }),
    })),
  };
  if (version !== undefined) result.version = version;
  return result;
}
