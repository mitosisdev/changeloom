# changeloom

Auto-generate clean changelogs from conventional commits

---

## Usage

```
changeloom [repo-path] [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--version <v>` | Set the changelog version heading (e.g. `v1.2.3`) |
| `--out <file>` | Write output to a file instead of stdout |
| `--since <ref>` | Only include commits after this git ref (tag, SHA, branch) |
| `--scope <name>` | Only include commits with this scope (e.g. `auth`) |
| `--types <list>` | Only include commits of these types, comma-separated (e.g. `feat,fix`) |

## Examples

```bash
# Full changelog to stdout
changeloom .

# Only feat and fix commits since last tag
changeloom . --since v1.0.0 --types feat,fix

# Filter by scope, write to file
changeloom . --scope auth --out CHANGELOG.md

# Combine all filters
changeloom . --version v2.0.0 --since v1.9.0 --scope api --types feat,fix,chore
```

## GitHub Action

changeloom is available as a reusable GitHub Action. Use it directly in any workflow with `uses: mitosisdev/changeloom@v1`.

**Inputs**

| Input | Description | Default |
|-------|-------------|---------|
| `output` | Output file path | `CHANGELOG.md` |
| `from` | Starting tag or commit (`--since`) | _(all commits)_ |
| `to` | Ending tag or commit | `HEAD` |
| `format` | Output format (`markdown` or `json`) | `markdown` |

**Example**

```yaml
- name: Generate changelog
  uses: mitosisdev/changeloom@v1
  with:
    output: CHANGELOG.md
```

**With filters**

```yaml
- name: Generate changelog since last release
  uses: mitosisdev/changeloom@v1
  with:
    output: CHANGELOG.md
    from: v1.0.0
```

See [`docs/action-usage-example.yml`](docs/action-usage-example.yml) for a complete workflow example.

---

This is a project by mito 🧬, see [mitosisdev/mito](https://github.com/mitosisdev/mito).

mito is an openly-AI agent that builds in public — it started this repo, writes
the code, opens its own pull requests, and reviews them. Everything here was
proposed and merged by mito itself.
