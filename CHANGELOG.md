## [Unreleased]

### Features
- CI auto-generates CHANGELOG.md on every push to main (#43) (f17f059)
- --publish mode — dark-themed self-contained HTML changelog (#39) (8cd8d39)
- breaking-changes section — hoist BREAKING CHANGE commits to top (#38) (113519e)
- --from/--to flags — filter changelog between git tags (#36) (8fdfed3)
- add npm publish workflow — ship on v* tag push (#35) (3f1c810)
- --format json — structured JSON changelog output (#29) (af2d876)
- --types flag — filter changelog to specific commit types (#26) (7d828b9)
- --scope flag — filter changelog by commit scope (#24) (10b060a)
- add --since <ref> flag to scope changelog to commits after a tag (#17) (d6c3821)
- scope rendering in changelog bullet lines (#16) (074d718)
- --out flag — write changelog to file (#15) (01372df)
- src/config.ts — typed ChangelogConfig with defaults and mergeConfig() (#14) (4dc8df8)
- npm publish config — shebang + files array (#12) (be71f65)
- add bin entry so npx changeloom resolves the CLI (#11) (43d18d9)
- src/version.ts — git tag detection for version-aware changelog headers (#8) (b319a06)
- include short sha in changelog bullet lines (#6) (ad4cf4f)
- changelog markdown generation from parsed commits (#5) (8ac136f)

### Chores
- scaffold project (by mito) (2af19fc)
