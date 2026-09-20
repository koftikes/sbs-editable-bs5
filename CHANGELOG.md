# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-09-20

### Added

- `type: 'autocomplete'` — a text input with filtered suggestions. `source` accepts the same shapes as `type: 'select'` (array, `{value: text}` map, sync/async function, ajax URL), plus `threshold` (minimum characters typed before suggestions appear, default `2`), `maxItems` (cap on suggestions shown; unset or `0` means unlimited), and `allowCustomValue` (accept typed text that matches nothing in `source`, default `false`). Strict by default: the typed text must resolve to a `source` entry, either by selecting it or by typing the exact label out by hand. Keyboard: Arrow Up/Down highlights a suggestion without moving focus off the input, Enter picks it, Escape closes the suggestion list first and a second Escape closes the editor. Follows the ARIA combobox pattern (`role="combobox"`/`"listbox"`/`"option"`, `aria-expanded`, `aria-activedescendant`). Documented in `doc/input-types-and-modes.md`.
- `aria-label` is now set on the generated control from `options.title` when it's non-empty, for every input type in both modes — previously `title` only reached the popup's header, leaving `mode: 'inline'` fields (and any control's screen-reader name generally) unlabeled. An explicit `attributes['aria-label']` overrides it (`aria-label` is now allow-listed in `attributes`).

### Fixed

- `DateType`/`DateTimeType`: a value read back via `getValue()` (stored internally in `format`'s shape) and fed into a new instance as `value` (expected in `displayFormat`'s shape) produced `Invalid Date` whenever `format` differs from `displayFormat` — e.g. destroying and recreating an instance to switch its mode. A strict parse against `format` is now tried first.

## [1.1.0] - 2026-09-20

### Added

- `source` (`type: 'select'`) now accepts, in addition to an array of `{value, text}`: a flat array of strings/numbers, a `{value: text}` object map, a `children` array per item to render `<optgroup>`s, and `disabled` per option.
- `source` can also be an ajax URL string or a function (sync, or returning a `Promise`) - resolved synchronously when possible so existing array/object sources keep rendering in the same tick as before; ajax/async sources show the same loading overlay used while saving.
- `sourceCache` option (`type: 'select'`, default `true`) — dedupes an ajax `source` response by URL across fields on the page instead of re-fetching per field.
- `attributes.placeholder` on `type: 'select'` now renders as a disabled, empty-value option prepended to the list, selected by default whenever no value is set — `<select>` has no native `placeholder` attribute, so this is the equivalent of what `attributes.placeholder` already does natively for input/textarea/date.
- `Editable.ListType` — the abstract base `SelectType` is built on, exported for custom list-sourced types (mirrors `BaseType`'s existing extensibility path).

### Fixed

- A `<select>`'s live value could end up wrong (defaulting to the first option) if an ajax/async `source` resolved while the editor was already open — `event_show()` had already applied the configured value once, against a control with no options yet. It's now re-applied after the source resolves.
- An ajax/async `source` failure is no longer silently hidden on the next reopen. Previously, `event_show()`'s cleanup of stale save errors also hid a still-unresolved source-load error for good, since (in popup mode) the source is only ever fetched once. Reopening now retries the source and shows a fresh error if it still fails.
- A function-valued `source` returning a `Promise` was being called twice per load (once to check whether it returned a `Promise`, discarding that call, then again for real) — a problem for any source function with a side effect (a real request, a counter, anything non-idempotent). It's now called exactly once.
- In `mode: 'inline'`, a successfully-resolved async `source` could wipe out the open editor - refreshing the (closed) trigger's label reused the same element the open editor is rendered into, so writing to its `textContent` deleted the `<select>` that was just built. Now skipped while the editor is showing inline.
- In `mode: 'inline'`, the loading overlay shown while `source` is fetching had no positioned ancestor to anchor to, so it rendered detached from the actual control instead of covering it. `.editable-form` is now an explicit positioning context.
- In `mode: 'inline'`, cancelling (or pressing Esc) with an empty value left the trigger with no text at all — collapsed to zero width and impossible to click again — because closing wrote the raw value directly instead of going through the usual `emptyText` fallback.

## [1.0.2] - 2026-09-19

### Added

- `CONTRIBUTING.md` — the former README "Development" section, covering the local dev workflow (clone, dev server, build, tests, lint).
- `CHANGELOG.md` (this file), backfilled from git history in Keep a Changelog format.
- `doc/` reference pages — `getting-started`, `server-integration`, `options-reference`, `api-reference`, `input-types-and-modes`, `advanced`, `troubleshooting` — with `doc/README.md` as an index.
- npm search `keywords` in `package.json`.

### Changed

- `README.md` trimmed to a landing page (intro, features, quick install, License, links to `doc/`) — everything else moved into `doc/*.md` with no content dropped in the move.
- Reworked `PUBLISHING.md`'s release flow and documented npm org membership as a prerequisite.
- Added `doc`, `CHANGELOG.md`, `CONTRIBUTING.md`, and `PUBLISHING.md` to `package.json`'s `files` so `README.md`'s relative links resolve from the published npm tarball too, not just GitHub.
- `.github/workflows/publish.yml` now installs Playwright's browser before running tests, so its own `test` step doesn't fail on a fresh runner.

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

[Unreleased]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/koftikes/sbs-editable-bs5/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/koftikes/sbs-editable-bs5/releases/tag/v1.0.0
