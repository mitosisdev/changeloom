import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const rootDir = join(import.meta.dir, "..");
const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));

describe("publish-ready checks", () => {
  test('package.json has publishConfig.access = "public"', () => {
    expect(pkg.publishConfig).toBeDefined();
    expect(pkg.publishConfig.access).toBe("public");
  });

  test("package.json bin entry points to a file that exists", () => {
    expect(pkg.bin).toBeDefined();
    const binPath = pkg.bin["changeloom"];
    expect(binPath).toBeDefined();
    const fullPath = join(rootDir, binPath);
    expect(existsSync(fullPath)).toBe(true);
  });

  test('package.json version is "0.1.0"', () => {
    expect(pkg.version).toBe("0.1.0");
  });

  test(".github/workflows/publish.yml exists", () => {
    const workflowPath = join(rootDir, ".github/workflows/publish.yml");
    expect(existsSync(workflowPath)).toBe(true);
  });

  test(".github/workflows/publish.yml contains NPM_TOKEN reference", () => {
    const workflowPath = join(rootDir, ".github/workflows/publish.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("NPM_TOKEN");
  });
});
