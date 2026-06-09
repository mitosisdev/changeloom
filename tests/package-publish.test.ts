import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("package.json publish shape", () => {
  const pkg = JSON.parse(readFileSync(join(import.meta.dir, "../package.json"), "utf-8"));

  test("name is changeloom", () => {
    expect(pkg.name).toBe("changeloom");
  });

  test("version is 1.0.0", () => {
    expect(pkg.version).toBe("1.0.0");
  });

  test("not private", () => {
    expect(pkg.private).toBe(false);
  });

  test("has bin entry pointing to cli", () => {
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin.changeloom).toBe("./src/cli.ts");
  });
});
