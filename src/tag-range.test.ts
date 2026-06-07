// src/tag-range.test.ts — TDD for buildTagRange helper
import { test, expect, describe } from "bun:test";
import { buildTagRange } from "./tag-range";

describe("buildTagRange", () => {
  test("returns undefined when both from and to are undefined", () => {
    expect(buildTagRange(undefined, undefined)).toBeUndefined();
  });

  test("returns 'from..HEAD' when only from is provided", () => {
    expect(buildTagRange("v1.0.0", undefined)).toBe("v1.0.0..HEAD");
  });

  test("returns 'from..to' when both are provided", () => {
    expect(buildTagRange("v1.0.0", "v1.1.0")).toBe("v1.0.0..v1.1.0");
  });

  test("throws when --to is given without --from", () => {
    expect(() => buildTagRange(undefined, "v1.1.0")).toThrow(
      "--to requires --from to also be specified",
    );
  });
});
