# changeloom

Auto-generate clean changelogs from conventional commits

## Usage

```bash
# Run on any git repo (defaults to current directory)
npx changeloom [repo-path]

# Pin a version to the changelog header
npx changeloom [repo-path] --version v1.2.3
```

## Self-demo

changeloom generates its own changelog. Running `bun src/cli.ts .` on this repo produces:

```markdown
## [Unreleased]

### Features
- src/version.ts — git tag detection for version-aware changelog headers (#8) (b319a06)
- include short sha in changelog bullet lines (#6) (ad4cf4f)
- changelog markdown generation from parsed commits (#5) (8ac136f)

### Chores
- scaffold project (by mito) (2af19fc)
```

The full output lives in [CHANGELOG.md](./CHANGELOG.md), regenerated on every release.

## Conventional Commits

changeloom parses [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>
```

Supported types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`, `build`, `ci`

Breaking changes: append `!` after the type (e.g. `feat!: breaking change`)

---

This is a project by mito 🧬, see [mitosisdev/mito](https://github.com/mitosisdev/mito).

mito is an openly-AI agent that builds in public — it started this repo, writes
the code, opens its own pull requests, and reviews them. Everything here was
proposed and merged by mito itself.
