// src/config.test.ts — TDD for changelog config
import { test, expect, describe } from "bun:test";
import {
  defaultConfig,
  mergeConfig,
  type ChangelogConfig,
} from "./config";

describe("defaultConfig", () => {
  test("typeOrder is a non-empty array of strings", () => {
    expect(Array.isArray(defaultConfig.typeOrder)).toBe(true);
    expect(defaultConfig.typeOrder.length).toBeGreaterThan(0);
    for (const t of defaultConfig.typeOrder) {
      expect(typeof t).toBe("string");
    }
  });

  test("versionPrefix is 'v'", () => {
    expect(defaultConfig.versionPrefix).toBe("v");
  });

  test("includeBreaking is true", () => {
    expect(defaultConfig.includeBreaking).toBe(true);
  });

  test("includeScopes is true", () => {
    expect(defaultConfig.includeScopes).toBe(true);
  });
});

describe("mergeConfig", () => {
  test("with no args returns a copy of defaultConfig (equal but not same ref)", () => {
    const merged = mergeConfig();
    expect(merged).toEqual(defaultConfig);
    expect(merged).not.toBe(defaultConfig);
  });

  test("overrides just versionPrefix, rest are defaults", () => {
    const merged = mergeConfig({ versionPrefix: "" });
    expect(merged.versionPrefix).toBe("");
    expect(merged.typeOrder).toEqual(defaultConfig.typeOrder);
    expect(merged.includeBreaking).toBe(defaultConfig.includeBreaking);
    expect(merged.includeScopes).toBe(defaultConfig.includeScopes);
  });

  test("overrides just typeOrder, rest stay default", () => {
    const merged = mergeConfig({ typeOrder: ["feat"] });
    expect(merged.typeOrder).toEqual(["feat"]);
    expect(merged.versionPrefix).toBe(defaultConfig.versionPrefix);
    expect(merged.includeBreaking).toBe(defaultConfig.includeBreaking);
    expect(merged.includeScopes).toBe(defaultConfig.includeScopes);
  });

  test("merges partial over a custom base (not defaultConfig)", () => {
    const customBase: ChangelogConfig = {
      typeOrder: ["fix", "feat"],
      versionPrefix: "release-",
      includeBreaking: false,
      includeScopes: false,
    };
    const merged = mergeConfig({ includeScopes: true }, customBase);
    // partial override applied
    expect(merged.includeScopes).toBe(true);
    // rest come from customBase, NOT defaultConfig
    expect(merged.typeOrder).toEqual(["fix", "feat"]);
    expect(merged.versionPrefix).toBe("release-");
    expect(merged.includeBreaking).toBe(false);
  });

  test("returns a new object and does not mutate the partial input", () => {
    const partial = { versionPrefix: "x" };
    const merged = mergeConfig(partial);
    expect(merged).not.toBe(partial);
    // partial untouched
    expect(Object.keys(partial)).toEqual(["versionPrefix"]);
    expect((partial as Partial<ChangelogConfig>).typeOrder).toBeUndefined();
  });

  test("does not mutate the base config", () => {
    const base: ChangelogConfig = {
      typeOrder: ["feat"],
      versionPrefix: "v",
      includeBreaking: true,
      includeScopes: true,
    };
    const snapshot = { ...base, typeOrder: [...base.typeOrder] };
    mergeConfig({ versionPrefix: "z" }, base);
    expect(base).toEqual(snapshot);
  });
});
