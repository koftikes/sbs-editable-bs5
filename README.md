# @sbsweb/editable-bs5

In-place ("click to edit") editing for HTML elements, built for Bootstrap 5.

`@sbsweb/editable-bs5` lets users edit individual values directly on a page without opening a separate form.

It is written in TypeScript and has no jQuery or Moment.js dependency. Date and datetime formatting are provided by the bundled Day.js dependency.

Conceptually inspired by [x-editable](https://github.com/vitalets/x-editable), but it is **not a drop-in replacement**. Option names, defaults, lifecycle, and API are different.

## Features

- Bootstrap 5.3+
- No jQuery
- TypeScript
- ESM, IIFE, and CommonJS builds
- Popup and inline editing modes
- Local-only editing
- Server-side persistence
- Configurable HTTP requests
- JSON API integration
- Dynamic URLs
- Native HTML validation
- Text, textarea, select, number, date, datetime, and native input types
- Custom input types and editing modes
- Custom value rendering
- Lifecycle events and callbacks
- TypeScript declarations

## Installation

```bash
npm install @sbsweb/editable-bs5
```

```ts
import Editable from '@sbsweb/editable-bs5';

new Editable(document.querySelector('#username')!, {
    url: '/users/42/username',
});
```

See [Getting started](doc/getting-started.md) for the browser `<script>` build, CommonJS, and `data-*` attribute configuration.

## Documentation

- [Getting started](doc/getting-started.md) — requirements, installation, quick start, how local vs. server-side editing works
- [Server integration](doc/server-integration.md) — default request, JSON responses, dynamic URLs, custom requests, CSRF
- [Options reference](doc/options-reference.md) — all options, `data-*` attribute mapping, `render`
- [API reference](doc/api-reference.md) — instance methods, dynamic content, TypeScript
- [Input types and editing modes](doc/input-types-and-modes.md) — text/select/date/etc., popup vs. inline
- [Advanced usage](doc/advanced.md) — events, custom types/modes, accessibility
- [Troubleshooting](doc/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)
- [Publishing](PUBLISHING.md) — release process for maintainers
- [Changelog](CHANGELOG.md)

## License

MIT

Copyright © Konstantin Litvinov
