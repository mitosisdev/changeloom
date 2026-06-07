// src/tag-range.ts — build a git log range string from --from / --to tag flags

/**
 * Builds a git log range string from optional from/to tags.
 *
 * - buildTagRange("v1.0.0", undefined)  → "v1.0.0..HEAD"
 * - buildTagRange("v1.0.0", "v1.1.0")  → "v1.0.0..v1.1.0"
 * - buildTagRange(undefined, undefined) → undefined  (no range filter)
 * - buildTagRange(undefined, "v1.1.0") → throws (--to without --from)
 */
export function buildTagRange(
  from: string | undefined,
  to: string | undefined,
): string | undefined {
  if (to !== undefined && from === undefined) {
    throw new Error("--to requires --from to also be specified");
  }
  if (from === undefined) {
    return undefined;
  }
  return `${from}..${to ?? "HEAD"}`;
}
