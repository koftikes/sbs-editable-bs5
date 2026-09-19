# Publishing

Releases are published to npm manually, from a maintainer's machine. CI
(`.github/workflows/ci.yml`) only runs `lint` / `typecheck` / `test` / `build`
on every push, PR, and version tag — it never runs `npm publish`. Two reasons:

- npm's [staged publishing](https://docs.npmjs.com/staged-publishing) flow
  (stage → review → approve) **cannot be used for a package's first release**
  — staging requires the package to already exist on the registry.
- Publishing requires OTP/2FA approval, which doesn't fit an unattended CI
  step anyway.

## Prerequisites

- npm CLI ≥ 11.15.0, Node ≥ 22.14.0 (this repo's `.nvmrc` already satisfies
  both).
- Two-factor authentication enabled on your npm account.
- Membership in the `sbsweb` org on npm, with publish rights to
  `@sbsweb/editable-bs5`. Unlike an unscoped name, this is **not**
  first-come-first-served — an org admin has to add you
  (`npm org set sbsweb <user> developer` or via the npmjs.com UI) before you
  can publish.
- A working npm session:

  ```bash
  npm whoami
  ```

  If this fails (`401 Unauthorized`) or you've never logged in on this
  machine, run `npm login` first (see **Troubleshooting** below for what an
  invalid/expired token looks like).

## Releasing

1. Bump `version` in `package.json` and commit it.
2. Tag and push:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

   Wait for CI to go green on that tag (Actions tab) — it validates lint,
   types, the full test suite, and that the library still builds. There is
   **no automated check that the tag matches `package.json`'s version** —
   double-check that yourself before publishing.
3. Build and publish locally, from a clean checkout of the tag:

   ```bash
   npm ci
   npm run build   # also runs automatically via prepublishOnly
   ```

### First release (v1.0.0) — plain `npm publish`

Staging isn't available yet (see above), so publish directly:

```bash
npm publish
```

npm will prompt for a one-time password (OTP) from your authenticator app.
Scoped packages publish **private** by default — `package.json` already sets
`publishConfig.access: "public"`, so a plain `npm publish` still makes this
one public without needing an explicit `--access public` flag.

### Every release after that — staged publishing

Once the package exists on the registry, use the three-step staged flow
instead of a single blind `npm publish`:

```bash
# 1. Stage — does not require 2FA
npm stage publish

# 2. Review — inspect exactly what would go live
npm stage list
npm stage view <stage-id>
npm stage download <stage-id>   # pull the tarball and check its contents by hand

# 3. Approve — this step prompts for OTP
npm stage approve <stage-id>
```

Nothing is public until step 3 completes.

## Troubleshooting

### `npm publish` fails with `E404 Not Found - PUT .../@sbsweb%2feditable-bs5`

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
staged-publish approvals.
