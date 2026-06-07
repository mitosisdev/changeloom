import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = join(import.meta.dir, "..");

describe("publish workflow", () => {
  const workflowPath = join(root, ".github/workflows/publish.yml");

  test("publish.yml exists", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  test("triggers on v* tags", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("v*");
    expect(content).toContain("tags:");
  });

  test("uses NPM_TOKEN env var", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("NPM_TOKEN");
  });

  test("runs npm publish", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("npm publish");
  });
});

describe("package.json publish shape", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));

  test("has name field", () => {
    expect(pkg.name).toBeDefined();
    expect(typeof pkg.name).toBe("string");
  });

  test("has bin field", () => {
    expect(pkg.bin).toBeDefined();
  });

  test("has files field", () => {
    expect(pkg.files).toBeDefined();
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files.length).toBeGreaterThan(0);
  });
});
