import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const rootDir = join(import.meta.dir, "..");
const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
const cliFirstLine = readFileSync(join(rootDir, "src/cli.ts"), "utf-8").split("\n")[0];

describe("npm publish config", () => {
  it('package.json has name "changeloom"', () => {
    expect(pkg.name).toBe("changeloom");
  });

  it("package.json has bin.changeloom", () => {
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin["changeloom"]).toBeDefined();
  });

  it('package.json has files array containing "src/"', () => {
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files).toContain("src/");
  });

  it('package.json does NOT have "private": true', () => {
    expect(pkg.private).not.toBe(true);
  });

  it('src/cli.ts first line starts with "#!/usr/bin/env bun"', () => {
    expect(cliFirstLine.startsWith("#!/usr/bin/env bun")).toBe(true);
  });
});
