# Publishing

The **first** release is published to npm manually, from a maintainer's
machine — npm's
[trusted publishing](https://docs.npmjs.com/trusted-publishers) can only be
configured for a package that already exists on the registry, so there's a
bootstrap step. Every release **after** that is published automatically by
`.github/workflows/publish.yml` when a `vX.Y.Z` tag is pushed, using OIDC
(no npm token stored anywhere, no OTP prompt).

`.github/workflows/ci.yml` (`lint` / `typecheck` / `test` / `build`) still
runs on every push, PR, and tag — it never publishes. `publish.yml` runs its
own `lint` → `test` → `build` → `publish` sequence before publishing, so it
doesn't depend on `ci.yml` finishing first (the two workflows run in
parallel on a tag push).

## Prerequisites

- npm CLI ≥ 11.5.1, Node ≥ 22.14.0 (this repo's `.nvmrc` already satisfies
  both — required for trusted publishing, not just the manual first
  release).
- Two-factor authentication enabled on your npm account (needed for the
  manual first release only; the automated flow doesn't prompt for OTP).
- Membership in the `sbsweb` org on npm, with publish rights to
  `@sbsweb/editable-bs5`. Unlike an unscoped name, this is **not**
  first-come-first-served — an org admin has to add you
  (`npm org set sbsweb <user> developer` or via the npmjs.com UI) before you
  can publish.
- A working npm session (for the manual first release):

  ```bash
  npm whoami
  ```

  If this fails (`401 Unauthorized`) or you've never logged in on this
  machine, run `npm login` first (see **Troubleshooting** below for what an
  invalid/expired token looks like).

## First release (v1.0.0) — manual `npm publish`

Trusted publishing isn't available yet (see above), so publish directly,
from a clean checkout of the tag:

```bash
git tag v1.0.0
git push origin v1.0.0

npm ci
npm run build   # also runs automatically via prepublishOnly
npm publish
```

npm will prompt for a one-time password (OTP) from your authenticator app.
Scoped packages publish **private** by default — `package.json` already sets
`publishConfig.access: "public"`, so a plain `npm publish` still makes this
one public without needing an explicit `--access public` flag.

## One-time setup: connect the trusted publisher

Once `@sbsweb/editable-bs5` exists on the registry (right after the step
above), wire up automated releases:

1. On npmjs.com: **Packages → `@sbsweb/editable-bs5` → Settings → Trusted
   Publisher**.
2. Add a **GitHub Actions** publisher with:
   - **Organization or user:** `koftikes` (the GitHub account the repo
     lives under — this is *not* the `sbsweb` npm org; those are two
     separate namespaces).
   - **Repository:** `sbs-editable-bs5`
   - **Workflow filename:** `publish.yml` (filename only, not the full
     `.github/workflows/` path).
   - **Environment:** leave empty — the workflow doesn't use one.
   - **Allowed actions:** enable `npm publish` (`npm stage publish` is
     always allowed regardless).
3. Confirm `repository.url` in `package.json` still matches the GitHub repo
   exactly — trusted publishing authenticates against that field, and a
   mismatch fails the OIDC exchange with an auth error, not a helpful one.

This connection can't be edited afterward — only deleted and recreated — so
double-check the fields before saving.

## Every release after that — automated

```bash
# 1. Bump `version` in package.json and commit it.
git commit -am "vX.Y.Z"

# 2. Tag and push — this is what triggers publish.yml.
git tag vX.Y.Z
git push origin vX.Y.Z
```

Watch the **Actions** tab: `publish.yml` checks out the tag, installs deps,
lints, runs the full Playwright test suite, builds, then runs `npm publish`
using a short-lived OIDC token — no `NPM_TOKEN` secret exists in this repo,
and none should be added. Provenance is attached automatically for public
packages published this way, no `--provenance` flag needed.

There is **no automated check that the tag matches `package.json`'s
version** — double-check that yourself before tagging.

## Troubleshooting

### `npm publish` fails with `E404 Not Found - PUT .../@sbsweb%2feditable-bs5`

(Manual publish only — the automated flow surfaces a different error, see
below.)

This looks like "the package doesn't exist," but for a brand-new package name
it almost always means **the request wasn't authenticated** — npm
deliberately returns 404 instead of 401/403 on publish when the caller isn't
authorized, so it doesn't leak whether a package name exists to an
unauthenticated request.

Confirm with:

```bash
npm whoami
```

If that also fails with `401 Unauthorized`, your token in `~/.npmrc` is
invalid, expired, or was revoked. Fix:

```bash
npm logout
npm login
npm whoami   # should now print your npm username
npm publish
```

If `npm whoami` succeeds but you still get `E404`, the more likely cause for
a scoped package is that you're authenticated but **not a member of the
`sbsweb` org** (or lack publish rights in it) — check with:

```bash
npm org ls sbsweb
```

If you're using a **Granular Access Token** instead of `npm login`, make sure
it includes **read/write access to the `sbsweb` org's packages** (or "All
packages" unrestricted) for the first release — npm can't let you scope a
token to a package that doesn't exist yet. Once `v1.0.0` is live, you can
create a narrower token scoped just to `@sbsweb/editable-bs5` for future
manual publishes, if you ever need one.

### `publish.yml` fails on the `Publish` step with an OIDC/auth error

- **Trusted publisher not configured yet** — see the one-time setup above;
  until it exists, `npm publish` in CI has no credentials at all and fails
  fast.
- **`repository.url` mismatch** — must exactly match
  `github.com/koftikes/sbs-editable-bs5`, protocol and all.
- **Workflow filename mismatch** — the trusted publisher config must say
  exactly `publish.yml`; renaming the workflow file requires updating (or
  recreating) that config too.
- **Missing `id-token: write`** — check `permissions:` at the top of
  `publish.yml` wasn't edited away; without it no OIDC token is minted.
