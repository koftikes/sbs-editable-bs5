# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-09-19

### Added

- Automated npm publishing on `vX.Y.Z` tag push via GitHub Actions, using npm Trusted Publishing (OIDC) — no npm token is stored as a repository secret, and provenance is attached automatically.

### Changed

- Rewrote `PUBLISHING.md` around the resulting two-phase release model: the first release is still published manually (a trusted publisher can't be registered for a package that doesn't exist yet on the registry), and every release after that is automated.

## [1.0.0] - 2026-09-19

Initial release, published as `@sbsweb/editable-bs5`.

### Added

- `destroy()` for tearing down an instance and its event handlers, fixing prior memory leaks.
- `render(text, context)` — a display-only formatting pass, independent of the value sent to the server.
- `requestBuilder` to fully override the default request (method, headers, body) when the default `POST` + `FormData` isn't sufficient; `url` may also be a function resolved per submit.
- Console warnings via `checkUnsupportedOptions()` when an option is given to a type it doesn't apply to (e.g. `format`/`displayFormat` outside `date`/`datetime`).
- `attributes` support generalized to every input type, not just `InputType`.
- Accessibility: Esc-to-cancel, `role="alert"` on the error region for screen readers, focus returned to the trigger on cancel/Escape/successful save, and keyboard operability (`tabindex`/`role="button"`, Enter/Space) for triggers without native interactive semantics.
- Dark-theme support: the loader spinner derives its color from `--bs-body-color`, and popovers (appended to `<body>` by Bootstrap) now inherit the nearest `data-bs-theme` so they render in the trigger's theme rather than the page default.
- Full real-browser test suite (Vitest + Playwright/Chromium) covering lifecycle, memory leaks, the `disabled`/`attributes.disabled` distinction, name/url/requestBuilder resolution, `render`, `checkUnsupportedOptions`, date/select behavior, local-only saves, server success/error handling, `ajaxOptions` merging, lifecycle events, and the `registerType`/`registerMode` extension points.
- GitHub Actions CI: `lint`, `typecheck`, `test`, and `build` jobs on every push, PR, and version tag.

### Changed

- Replaced moment.js with the bundled, smaller day.js.
- Renamed options to camelCase for consistency: `emptytext` → `emptyText`, `showbuttons` → `showButtons`, `viewformat` → `displayFormat`.
- Reworked the request layer: the submitted field key now resolves from `data-name`, falling back to the element's `id`, then to the literal key `"value"`; dropped the `pk` option and the GET auto-query behavior (editing is a mutation, not a GET).
- Moved `ajaxOptions`/`attributes`/`popoverOptions` to JS-only configuration, since object values can't round-trip through `data-*` attributes.
- Thrown errors now name the offending class/option and list valid alternatives; configuration errors (plain `Error`) are distinguished from genuine `fetch()` failures (`TypeError`), so only the latter surface in the form's error UI.
- Adopted Biome for linting/formatting (4-space indent, single quotes) and reformatted the codebase; tightened TypeScript types across the option-bag helpers, replacing `any` with precise types.
- Removed the top-level `disabled` option — `enable()`/`disable()` are now the only way to control it; `attributes.disabled` remains as a separate, input-level mechanism.
- Bumped Vite, TypeScript, and related plugins; added `engines` and`.nvmrc`.

### Fixed

- An icon-rendering hack, an XSS vector via `innerHTML`, and hardcoded inline styles from the original implementation.
- A static-export regression that broke the IIFE/UMD global.
- `SelectType`'s `source[].value` type, widened to `string | number` to match the documented example, with both sides of the comparison normalized via `String()`.
- The `Options` type for `source`, which was a single-element tuple instead of an array.

### Removed

- `attributes.name`/`attributes.value` (dead — always overwritten or never
  read).
- Generated `dist/` build output from version control.

[Unreleased]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/koftikes/sbs-editable-bs5/releases/tag/v1.0.0
