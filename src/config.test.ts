import { describe, it, expect } from "bun:test";
import { defaultConfig, mergeConfig } from "./config";

describe("defaultConfig", () => {
  it("has all expected section mappings", () => {
    expect(defaultConfig.sections).toEqual({
      feat: "Added",
      fix: "Fixed",
      refactor: "Changed",
      perf: "Changed",
      docs: "Changed",
      deprecated: "Removed",
      security: "Security",
    });
  });

  it("has correct defaultSection", () => {
    expect(defaultConfig.defaultSection).toBe("Other");
  });

  it("has correct breakingLabel", () => {
    expect(defaultConfig.breakingLabel).toBe("⚠ Breaking Changes");
  });

  it("has correct versionPrefix", () => {
    expect(defaultConfig.versionPrefix).toBe("v");
  });

  it("has empty includeTypes (include all)", () => {
    expect(defaultConfig.includeTypes).toEqual([]);
  });

  it("has empty excludeScopes (exclude none)", () => {
    expect(defaultConfig.excludeScopes).toEqual([]);
  });
});

describe("mergeConfig", () => {
  it("with no args returns defaultConfig values", () => {
    const result = mergeConfig();
    expect(result).toEqual(defaultConfig);
  });

  it("overrides only breakingLabel when specified", () => {
    const result = mergeConfig({ breakingLabel: "Breaking" });
    expect(result.breakingLabel).toBe("Breaking");
    expect(result.sections).toEqual(defaultConfig.sections);
    expect(result.defaultSection).toBe(defaultConfig.defaultSection);
    expect(result.versionPrefix).toBe(defaultConfig.versionPrefix);
    expect(result.includeTypes).toEqual(defaultConfig.includeTypes);
    expect(result.excludeScopes).toEqual(defaultConfig.excludeScopes);
  });

  it("merges sections (keeps defaults, overrides feat)", () => {
    const result = mergeConfig({ sections: { feat: "Features" } });
    expect(result.sections.feat).toBe("Features");
    expect(result.sections.fix).toBe("Fixed");
    expect(result.sections.refactor).toBe("Changed");
    expect(result.sections.security).toBe("Security");
  });

  it("sets includeTypes allowlist", () => {
    const result = mergeConfig({ includeTypes: ["feat", "fix"] });
    expect(result.includeTypes).toEqual(["feat", "fix"]);
    expect(result.sections).toEqual(defaultConfig.sections);
  });

  it("sets excludeScopes denylist", () => {
    const result = mergeConfig({ excludeScopes: ["internal"] });
    expect(result.excludeScopes).toEqual(["internal"]);
    expect(result.sections).toEqual(defaultConfig.sections);
  });
});
