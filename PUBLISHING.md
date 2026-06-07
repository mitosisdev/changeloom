# Publishing changeloom to npm

Changeloom uses a tag-triggered GitHub Actions workflow to publish to npm automatically.

## Prerequisites

Add your npm access token as a GitHub Actions secret named `NPM_TOKEN`:

1. Generate a token at <https://www.npmjs.com/settings/tokens> (Automation type)
2. In your GitHub repo go to **Settings → Secrets and variables → Actions**
3. Add a new secret: `NPM_TOKEN` = your token

## How to release

1. **Bump the version** in `package.json`:

   ```sh
   npm version patch   # 0.0.1 → 0.0.2
   npm version minor   # 0.0.1 → 0.1.0
   npm version major   # 0.0.1 → 1.0.0
   ```

   This edits `package.json` and creates a git tag automatically.

2. **Push the tag** to GitHub:

   ```sh
   git push origin --tags
   ```

   Or push the commit and the tag together:

   ```sh
   git push && git push origin --tags
   ```

3. **GitHub Actions picks it up** — the `publish.yml` workflow triggers on any `v*` tag, runs `bun test`, then publishes to npm with `npm publish --access public`.

## What the workflow does

- Triggered by: pushing a tag that matches `v*`
- Checks out the repo
- Installs dependencies with `bun install`
- Runs the test suite with `bun test` — publish is blocked if tests fail
- Publishes to npm using the `NPM_TOKEN` secret

## Manual publish (emergency)

If you need to publish without a tag:

```sh
bun install
bun test
npm publish --access public
```

You will need `NPM_TOKEN` set in your local environment or be logged in via `npm login`.
