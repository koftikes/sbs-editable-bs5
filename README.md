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
<script src="dist/editable.iife.js"></script>
```

| Build | When to use |
|---|---|
| `dist/editable.js` | ESM, for bundlers (`import Editable from 'sbs-editable-bs5'`) |
| `dist/editable.iife.js` | Plain `<script>` tag, exposes a global `Editable` |
| `dist/editable.umd.cjs` | CommonJS (`require`) |

## Quick start

**1. Mark up an editable element** — usually an `<a>` with `data-*` attributes:

```html
<a id="username" data-type="text" data-url="/post" data-title="Enter username">superuser</a>
```

Key attributes:
- `type` — input type (`text`, `textarea`, `select`, `date`, ...)
- `url` — endpoint that receives the submitted value (e.g. `/post`)
- `data-name` — the key the new value is submitted under. Falls back to the element's `id`, then to the literal key `value` if neither is set.
- `value` — initial value; if omitted, taken from the element's text content

**2. Initialize it:**

```js
const el = document.getElementById('username');
const editable = new Editable(el);
```

Or configure everything from JavaScript instead of `data-*` attributes:

```js
const editable = new Editable(el, {
    type: 'text',
    url: '/post',
    title: 'Enter username',
});
```

**3. Click the element, edit, submit.** The library sends a `POST` (by default) to `url` — the body is a single field, keyed by `name` (or the element's `id`, or the literal key `value` if neither is set):

```
username: 'superuser!'
```

## Backend contract

There are no restrictions on the server-side language/framework:

- **Valid value** → respond with HTTP `200`. The element updates automatically; no response body required.
- **Invalid value** → respond with a non-`200` status (e.g. `400`) and an error message in the body. The element keeps its old value and the form displays the error.

### JSON responses

If your server always returns `200` with an `error` flag in the JSON body instead of using HTTP status codes, handle it in `success`:

```js
const editable = new Editable(el, {
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
const editable = new Editable(el, {
    type: 'text',
    title: 'Enter username',
});
```

### Per-record endpoints

There's no `pk` option — if you're editing a specific record, build its identifier into the URL instead, by passing a function:

```js
new Editable(el, {
    type: 'text',
    url: (ctx, newValue) => `/api/users/${ctx.element.dataset.userId}/username`,
});
```

`ctx` is the `Editable` instance (so you can read `ctx.element`, `ctx.getValue()`, etc.) and `newValue` is the value about to be submitted. The function is called fresh on every submit, so it always sees current data — for example, this reuses one config for many rows:

```js
function endpointFor(resource) {
    return (ctx) => `/api/${resource}/${ctx.element.closest('[data-row-id]').dataset.rowId}`;
}

document.querySelectorAll('[data-type]').forEach(el => {
    new Editable(el, { url: endpointFor('products') });
});
```

### Custom request shape (`requestBuilder`)

By default, the library `POST`s a single `FormData` field, keyed by `name` (see above). If your backend expects JSON, a different HTTP method, extra headers, or anything else, take over the request entirely with `requestBuilder`:

```js
new Editable(el, {
    url: '/api/users/42',
    requestBuilder: (ctx, newValue, url) => ({
        url,
        init: {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [ctx.getOption('name')]: newValue }),
        },
    }),
});
```

`requestBuilder` receives the `Editable` instance, the new value, and the already-resolved `url` (so it works the same whether `url` is a string or a function). It can be `async`:

```js
new Editable(el, {
    requestBuilder: async (ctx, newValue, url) => {
        const token = await getCsrfToken();
        return {
            url,
            init: {
                method: 'POST',
                headers: { 'X-CSRF-Token': token },
                body: new URLSearchParams({ value: newValue }),
            },
        };
    },
});
```

When `requestBuilder` is set, it fully replaces the default request — `ajaxOptions` and the `name`-based field key no longer apply; you're building the whole `RequestInit` yourself, GET query strings included.

## Options

Options can be set via JavaScript or `data-*` attributes. For multi-word camelCase options, use kebab-case in the attribute — the browser converts it automatically (e.g. `showButtons` → `data-show-buttons`, `displayFormat` → `data-display-format`).

Object/function-valued options (`ajaxOptions`, `attributes`, `popoverOptions`, `requestBuilder`, `success`, `error`, a function `url`) can only be set from JavaScript — `data-*` attributes are always strings, so there's no way to express an object or a function through them. Change these through `new Editable(el, {...})`, not markup.

#### Core

| Name | Type | Default | Description |
|---|---|---|---|
| `type` | `string \| class` | `'text'` | Input type: `text`, `textarea`, `select`, `date`, `datetime`, an [HTML5 type](#html5-types), or a custom `BaseType` subclass. |
| `mode` | `string` | `'popup'` | `'popup'` (Bootstrap Popover) or `'inline'` (renders in place). |
| `value` | `mixed` | element's text | Initial value. Falls back to the element's text content. |
| `name` | `string` | element's `id`, or `'value'` | Key the new value is submitted under (see [Backend contract](#backend-contract)). |
| `title` | `string` | `''` | Popover/form title. |

#### Networking

| Name | Type | Default | Description |
|---|---|---|---|
| `url` | `string \| ((context, newValue) => string) \| null` | `null` | Endpoint the new value is submitted to. A function is resolved on every submit with the current instance and the new value — useful for per-record REST endpoints now that there's no `pk`. Only a plain string works via `data-url`; a function must be set from JavaScript. |
| `requestBuilder` | `(context, newValue, resolvedUrl) => { url, init }` | `null` | Fully overrides how the request is built (method, headers, body). Set from JavaScript only. See [Custom request shape](#custom-request-shape-requestbuilder). |
| `send` | `boolean` | `true` | When `true`, the value is sent to `url` if it's set; otherwise it's only stored locally on the element. |
| `ajaxOptions` | `object` | `{ method: 'POST' }` | Extra [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) options merged into the `fetch()` call. `method` must be a body-carrying verb (`POST`/`PUT`/`PATCH`/`DELETE`) — `GET` isn't supported here since saving an edit is a mutation; use `requestBuilder` if you need a bodyless request. JS only. |

#### Display

| Name | Type | Default | Description |
|---|---|---|---|
| `emptyText` | `string` | `'Empty'` | Text shown when the value is empty. |
| `showButtons` | `boolean` | `true` | When `false`, the form has no save/cancel buttons and auto-submits on `change`. |
| `popoverOptions` | `object` | `{}` | Passed through to the underlying [Bootstrap Popover](https://getbootstrap.com/docs/5.3/components/popovers/#options). Only applies in `popup` mode. JS only. |

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

Custom input types and modes are registered on `Editable` and referenced by name via the `type`/`mode` options — no need to fork the library to add one:

```js
import Editable from 'sbs-editable-bs5';

class RatingType extends Editable.BaseType {
    create() {
        // build and return your custom input element/container
    }
}

Editable.registerType('rating', RatingType);

new Editable(el, { type: 'rating' });
```

The same pattern applies to modes via `Editable.registerMode(name, ModeClass)`, extending `Editable.BaseMode`. You can also pass a class directly as `type` without registering it first.

## Events

```js
document.getElementById('username').addEventListener('save', function (e) {
    console.log('Saved', e.detail.Editable.getValue());
});
```

| Event | Description |
|---|---|
| `init` | Fired once the editable is fully initialized. Attach this listener *before* calling `new Editable(...)`. |
| `show` | Fired when the container starts showing and the form is rendered. |
| `shown` | Fired once the container has finished showing. |
| `hide` | Fired when the container starts hiding (on both save and cancel). |
| `hidden` | Fired once the container has finished hiding. |
| `save` | Fired after a new value has been submitted/accepted. |

All events dispatch with `event.detail.Editable` set to the instance.

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
| `attributes` | `object` | `{}` | Map of native HTML5 attributes applied to the input. JS only. |

```js
const editable = new Editable(el, {
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
