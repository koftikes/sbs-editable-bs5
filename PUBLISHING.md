# Publishing

This document describes how to publish `@sbsweb/editable-bs5` to npm.

The package is published automatically through **GitHub Actions** using **npm Trusted Publishing (OIDC)**.

## Overview

Releases are published by creating and pushing a matching Git tag; GitHub Actions publishes the package automatically.

Only tags matching `v*` trigger the publishing workflow.

Normal pushes and pull requests do **not** publish the package.

## Prerequisites

The repository uses:

- npm package: `@sbsweb/editable-bs5`
- npm organization: `sbsweb`
- GitHub repository: `koftikes/sbs-editable-bs5`
- GitHub Actions workflow: `.github/workflows/publish.yml`
- npm Trusted Publishing with GitHub Actions OIDC

Managing the trusted publisher configuration, or publishing manually if the
automated flow ever needs troubleshooting, requires membership in the
`sbsweb` npm organization with publish rights to `@sbsweb/editable-bs5`.
Unlike an unscoped package name, this is **not** first-come-first-served —
an org admin has to add you before you can publish.

The package is public and uses:

```json
{
    "publishConfig": {
        "access": "public"
    }
}
```

## Regular release

### 1. Update the version

Update the version in `package.json`:

```json
{
    "version": "1.2.0"
}
```

Use Semantic Versioning:

- `PATCH` — backward-compatible bug fixes
- `MINOR` — backward-compatible features
- `MAJOR` — breaking changes

### 2. Update the changelog

Add the release to `CHANGELOG.md`.

Example:

```markdown
## [1.2.0] - 2026-09-19

### Added

- Added ...

### Changed

- Changed ...

### Fixed

- Fixed ...
```

### 3. Run local checks

Before creating the release tag:

```bash
npm ci
npm run lint
npm test
npm run build
```

### 4. Commit the release

```bash
git add package.json CHANGELOG.md
git commit -m "Release v1.2.0"
git push
```

### 5. Create the release tag

The Git tag must exactly match the version in `package.json`:

```bash
git tag v1.2.0
```

Push the tag:

```bash
git push origin v1.2.0
```

### 6. GitHub Actions publishes the package

The `publish.yml` workflow starts automatically because the tag matches:

```yaml
on:
  push:
    tags:
      - 'v*'
```

The workflow should:

1. Check out the repository.
2. Install dependencies.
3. Verify that the Git tag matches `package.json`.
4. Run the build.
5. Run tests.
6. Publish the package to npm using Trusted Publishing.

## Version verification

The publishing workflow should verify the tag before publishing.

This prevents an accidental mismatch such as:

```text
package.json    1.2.0
Git tag         v1.2.1
```

Only the following combination should be published:

```text
package.json    1.2.0
Git tag         v1.2.0
```

The version check should happen **before** `npm publish`.

## Release checklist

Use this checklist for every release:

- [ ] Update `version` in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run `npm ci`
- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Run `npm run build`
- [ ] Verify the generated package with `npm pack --dry-run`
- [ ] Commit and push the release changes
- [ ] Create the matching `vX.Y.Z` tag
- [ ] Push the tag
- [ ] Verify the GitHub Actions workflow
- [ ] Verify the published npm version

## Verifying a release

After GitHub Actions finishes successfully:

```bash
npm view @sbsweb/editable-bs5 version
```

Verify a specific version:

```bash
npm view @sbsweb/editable-bs5@1.2.0
```

Verify the package contents:

```bash
npm pack @sbsweb/editable-bs5@1.2.0
```

You can also inspect the package metadata:

```bash
npm view @sbsweb/editable-bs5@1.2.0 --json
```

## Troubleshooting

### The publishing workflow does not start

Check that the tag matches the workflow trigger:

```text
v1.2.0
v1.3.0
v2.0.0
```

The workflow must contain:

```yaml
on:
  push:
    tags:
      - 'v*'
```

A normal branch push does not trigger publishing.

### Tag and package version do not match

For example:

```text
package.json    1.2.0
Git tag         v1.2.1
```

Delete the incorrect local tag:

```bash
git tag -d v1.2.1
```

If it was already pushed:

```bash
git push origin --delete v1.2.1
```

Create the correct tag:

```bash
git tag v1.2.0
git push origin v1.2.0
```

## Related files

The release process depends primarily on:

```text
package.json
CHANGELOG.md
.github/workflows/publish.yml
```

`package.json` defines the package name, version, build configuration, and npm publication settings.

`CHANGELOG.md` documents changes between releases.

`.github/workflows/publish.yml` performs the automated publication.

## Release flow

The complete regular release flow is:

```text
Update package.json
        │
        ▼
Update CHANGELOG.md
        │
        ▼
Run lint / test / build
        │
        ▼
Commit + push
        │
        ▼
Create vX.Y.Z tag
        │
        ▼
Push tag
        │
        ▼
GitHub Actions
        │
        ├── Verify version
        ├── Build
        ├── Test
        └── npm publish
                │
                ▼
             npm registry
```
