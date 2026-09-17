# sbs-editable-bs5

In-place ("click to edit") editing for HTML elements, built for **Bootstrap 5**. Written in plain TypeScript — no jQuery, no moment.js. Conceptually inspired by [x-editable](https://github.com/vitalets/x-editable), but not a drop-in replacement: option names and defaults differ (see [Options](#options)).

## Requirements

- **Bootstrap 5.3+**, including its bundled Popper build (`bootstrap.bundle.min.js`)

Date formatting ([day.js](https://day.js.org/)) is bundled internally — you don't need to install it separately.

## Installation

```bash
npm i sbs-editable-bs5
```

Or include the pre-built files directly:

```html
<link rel="stylesheet" href="bootstrap.min.css">
<script src="bootstrap.bundle.min.js"></script>
<script src="dist/dark-editable.iife.js"></script>
```

| Build | When to use |
|---|---|
| `dist/dark-editable.js` | ESM, for bundlers (`import DarkEditable from 'sbs-editable-bs5'`) |
| `dist/dark-editable.iife.js` | Plain `<script>` tag, exposes a global `DarkEditable` |
| `dist/dark-editable.umd.cjs` | CommonJS (`require`) |

## Quick start

**1. Mark up an editable element** — usually an `<a>` with `data-*` attributes:

```html
<a id="username" data-type="text" data-pk="1" data-url="/post" data-title="Enter username">superuser</a>
```

Key attributes:
- `type` — input type (`text`, `textarea`, `select`, `date`, ...)
- `url` — endpoint that receives the submitted value (e.g. `/post`)
- `pk` — primary key of the record being updated
- `id` / `data-name` — field name submitted to the server (falls back to the element's `id`)
- `value` — initial value; if omitted, taken from the element's text content

**2. Initialize it:**

```js
const el = document.getElementById('username');
const editable = new DarkEditable(el);
```

Or configure everything from JavaScript instead of `data-*` attributes:

```js
const editable = new DarkEditable(el, {
    type: 'text',
    pk: 1,
    url: '/post',
    title: 'Enter username',
});
```

**3. Click the element, edit, submit.** The library sends a `POST` (by default) to `url` with:

```
name:  'username'   // field name (column in db)
pk:    1             // primary key (record id)
value: 'superuser!'  // new value
```

## Backend contract

There are no restrictions on the server-side language/framework:

- **Valid value** → respond with HTTP `200`. The element updates automatically; no response body required.
- **Invalid value** → respond with a non-`200` status (e.g. `400`) and an error message in the body. The element keeps its old value and the form displays the error.

### JSON responses

If your server always returns `200` with an `error` flag in the JSON body instead of using HTTP status codes, handle it in `success`:

```js
const editable = new DarkEditable(el, {
    // ...
    success: async function (response, newValue) {
        const res = await response.json();
        if (res.error) return res.msg; // shown as the form's error message
    },
});
```

`response` is a standard [Fetch `Response`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

### Local-only mode (no server)

Omit `url` to skip the network request entirely and just update the element locally:

```js
const editable = new DarkEditable(el, {
    type: 'text',
    title: 'Enter username',
});
```

## Options

Options can be set via JavaScript or `data-*` attributes. For multi-word camelCase options, use kebab-case in the attribute — the browser converts it automatically (e.g. `showButtons` → `data-show-buttons`, `displayFormat` → `data-display-format`).

#### Core

| Name | Type | Default | Description |
|---|---|---|---|
| `type` | `string \| class` | `'text'` | Input type: `text`, `textarea`, `select`, `date`, `datetime`, an [HTML5 type](#html5-types), or a custom `BaseType` subclass. |
| `mode` | `string` | `'popup'` | `'popup'` (Bootstrap Popover) or `'inline'` (renders in place). |
| `value` | `mixed` | element's text | Initial value. Falls back to the element's text content. |
| `name` | `string` | element's `id` | Field name submitted to the server. |
| `title` | `string` | `''` | Popover/form title. |

#### Networking

| Name | Type | Default | Description |
|---|---|---|---|
| `url` | `string \| null` | `null` | Endpoint the new value is submitted to. |
| `pk` | `string \| null` | `null` | Primary key of the record being updated. |
| `send` | `boolean` | `true` | When `true`, the value is sent to `url` only if `pk` and `url` are both set; otherwise it's only stored locally on the element. |
| `ajaxOptions` | `object` | `{ method: 'POST' }` | Extra [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) options merged into the `fetch()` call. |

#### Display

| Name | Type | Default | Description |
|---|---|---|---|
| `emptyText` | `string` | `'Empty'` | Text shown when the value is empty. |
| `showButtons` | `boolean` | `true` | When `false`, the form has no save/cancel buttons and auto-submits on `change`. |
| `popoverOptions` | `object` | `{}` | Passed through to the underlying [Bootstrap Popover](https://getbootstrap.com/docs/5.3/components/popovers/#options). Only applies in `popup` mode. |

#### State

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Disables the editable on init. |
| `required` | `boolean` | `false` | Marks the input as required (native HTML5 validation). |

#### Callbacks

| Name | Type | Default | Description |
|---|---|---|---|
| `success` | `(response, newValue) => Promise<string \| void>` | `null` | Called after a `2xx` response. Return a truthy string to show it as an error instead of accepting the value. |
| `error` | `(response, newValue) => Promise<string \| void>` | `null` | Called after a non-`2xx` response. Return a string to override the default error message. |

## Methods

| Method | Parameters | Description |
|---|---|---|
| `enable()` | — | Enables the editable. |
| `disable()` | — | Disables the editable. |
| `getValue()` | — | Returns the current value. |
| `setValue(value)` | `value: Mixed` | Sets a new value and re-renders the display text. |
| `getOption(name)` | `name: string` | Returns the current value of an option. |
| `destroy()` | — | Tears down all listeners/Popover instances created for this element. Call this before removing the element from the DOM, or before re-initializing it. |

## Extensibility

Custom input types and modes are registered on `DarkEditable` and referenced by name via the `type`/`mode` options — no need to fork the library to add one:

```js
import DarkEditable from 'sbs-editable-bs5';

class RatingType extends DarkEditable.BaseType {
    create() {
        // build and return your custom input element/container
    }
}

DarkEditable.registerType('rating', RatingType);

new DarkEditable(el, { type: 'rating' });
```

The same pattern applies to modes via `DarkEditable.registerMode(name, ModeClass)`, extending `DarkEditable.BaseMode`. You can also pass a class directly as `type` without registering it first.

## Events

```js
document.getElementById('username').addEventListener('save', function (e) {
    console.log('Saved', e.detail.DarkEditable.getValue());
});
```

| Event | Description |
|---|---|
| `init` | Fired once the editable is fully initialized. Attach this listener *before* calling `new DarkEditable(...)`. |
| `show` | Fired when the container starts showing and the form is rendered. |
| `shown` | Fired once the container has finished showing. |
| `hide` | Fired when the container starts hiding (on both save and cancel). |
| `hidden` | Fired once the container has finished hiding. |
| `save` | Fired after a new value has been submitted/accepted. |

All events dispatch with `event.detail.DarkEditable` set to the instance.

## Input types

### Text

`type: 'text'`

| Name | Type | Default | Description |
|---|---|---|---|
| `placeholder` | `string` | `null` | Shown when the input is empty. |

### Textarea

`type: 'textarea'`

| Name | Type | Default | Description |
|---|---|---|---|
| `placeholder` | `string` | `null` | Shown when the input is empty. |

### Select

`type: 'select'`

| Name | Type | Default | Description |
|---|---|---|---|
| `source` | `array` | `[]` | `[{ value: 1, text: 'text1' }, { value: 2, text: 'text2' }, ...]` |

### Date

`type: 'date'`

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `string` | `YYYY-MM-DD` | Format used when submitting the value to the server, and when reading it from the `data-value` attribute. Uses [day.js tokens](https://day.js.org/docs/en/parse/string-format). |
| `displayFormat` | `string` | `YYYY-MM-DD` | Format used when displaying the value on the element. |

### Datetime

`type: 'datetime'`

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `string` | `YYYY-MM-DDTHH:mm` | Format used when submitting the value to the server, and when reading it from the `data-value` attribute. Uses [day.js tokens](https://day.js.org/docs/en/parse/string-format). |
| `displayFormat` | `string` | `YYYY-MM-DDTHH:mm` | Format used when displaying the value on the element. |

### HTML5 types

`type`: `password`, `email`, `url`, `tel`, `number`, `range`, `time`

| Name | Type | Default | Description |
|---|---|---|---|
| `attributes` | `object` | `{}` | Map of native HTML5 attributes applied to the input. |

```js
const editable = new DarkEditable(el, {
    type: 'number',
    attributes: {
        placeholder: 'Enter age',
        min: 0,
        max: 120,
        step: 1,
        required: true,
    },
});
```
