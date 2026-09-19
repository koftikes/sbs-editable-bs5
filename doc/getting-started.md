# Getting started

## Requirements

- Bootstrap 5.3+
- Bootstrap JavaScript bundle with Popper

Example:

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.bundle.min.js"></script>
```

The package uses Day.js for date and datetime handling. You do not need to install Day.js separately.

## When to use

`@sbsweb/editable-bs5` is designed for small, focused inline edits such as:

- table cells;
- profile fields;
- product attributes;
- administration panels;
- configuration values;
- status or metadata fields.

It is intentionally focused on individual values. For large forms, rich text editing, or complex multi-field workflows, a regular Bootstrap form is usually more appropriate.

## Installation

### npm / ESM

```bash
npm install @sbsweb/editable-bs5
```

```ts
import Editable from '@sbsweb/editable-bs5';

const editable = new Editable(document.querySelector('#username')!);
```

### Browser script

Load Bootstrap first, then the IIFE build:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/path/to/editable.iife.js"></script>
```

The library is available as the global `Editable`.

```html
<a id="username" data-type="text" data-url="/users/42/username" data-title="Enter User Name">
    SuperUser
</a>

<script>
    new Editable(document.querySelector('#username'));
</script>
```

### CommonJS

```js
const Editable = require('@sbsweb/editable-bs5');
```

### Package files

The published package contains:

```text
dist/
├── editable.js
├── editable.iife.js
├── editable.umd.cjs
└── editable.d.ts
```

## Quick start

### HTML configuration

Options can be configured with `data-*` attributes:

```html
<a id="username" data-type="text" data-url="/users/42/username" data-title="Enter User Name">
    SuperUser
</a>
```

Initialize it:

```ts
new Editable(document.querySelector('#username')!);
```

When the value is changed, the default request is sent to `/users/42/username`.

### JavaScript configuration

The same component can be configured entirely from JavaScript:

```ts
const editable = new Editable(element, {
    type: 'text',
    url: '/users/42/username',
    title: 'Enter username',
});
```

JavaScript configuration is useful when options contain functions, objects, or other values that cannot be represented by HTML attributes.

## How it works

There are two main usage patterns.

### Local editing

If no `url` is configured, the value is changed locally:

```ts
new Editable(element, {
    type: 'text',
});
```

No HTTP request is performed.

### Server-side editing

If a `url` is configured, the default request sends the edited value to the server.

```ts
new Editable(element, {
    type: 'text',
    name: 'username',
    url: '/users/42/username',
});
```

The default request uses `POST` and sends the field as `FormData`.

The submitted field name comes from the `name` option. If `name` is not explicitly configured, the element's `id` can be used as the field name.

## Browser support

The package targets modern browsers that support the JavaScript and DOM APIs used by Bootstrap 5 and the library.

For applications that must support older browsers, verify the required browser versions against your project's Bootstrap and JavaScript compatibility requirements.
