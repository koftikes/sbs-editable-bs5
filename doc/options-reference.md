# Options reference

Options can be supplied either through JavaScript or, where supported, through `data-*` attributes.

## Core

| Option | Default | Description |
| --- | --- | --- |
| `type` | `'text'` | Input type used for editing |
| `mode` | `'popup'` | Editing mode, such as popup or inline |
| `value` | The element's text content — treated as `''` if empty or if it contains only whitespace/`&nbsp;` | Initial value |
| `name` | The element's `id` attribute, or `'value'` if it has none | Field name sent to the server |
| `title` | `''` | Editor title |
| `required` | `false` | Enables required-value validation |

## Display

| Option | Default | Description |
| --- | --- | --- |
| `emptyText` | `'N/A'` | Text displayed when the value is empty |
| `showButtons` | `true` | Controls save/cancel buttons |
| `popoverOptions` | `{}` | Bootstrap popover configuration |
| `render` | None — the raw value is displayed as-is | Converts the value into its display representation |

## Networking

| Option | Default | Description |
| --- | --- | --- |
| `url` | `null` — no request is sent unless `url` or `requestBuilder` is set | Server endpoint or dynamic URL function |
| `ajaxOptions` | `{ method: 'POST' }` | Additional options for the default request |
| `requestBuilder` | None — the built-in fetch-based request is used | Fully replaces the default request — see [Server integration](server-integration.md) |

## Callbacks

| Option | Default | Description |
| --- | --- | --- |
| `success` | None | Called after a successful save |
| `error` | None | Called when saving fails |

## `type: 'date'` / `type: 'datetime'` only

| Option | Default | Description |
| --- | --- | --- |
| `format` | `'YYYY-MM-DD'` for `date`, `'YYYY-MM-DDTHH:mm'` for `datetime` | Value format sent to/from the server (day.js tokens) |
| `displayFormat` | Same as `format`'s default above — independent of whatever `format` is actually set to | Format used for the value shown on the trigger |

## `type: 'select'` only

| Option | Default | Description |
| --- | --- | --- |
| `source` | `[]` | The option list — array, `{value: text}` map, ajax URL, or a function. See [Input types and editing modes](input-types-and-modes.md#select) |
| `sourceCache` | `true` | Cache an ajax `source` response by URL across fields on the page |

## Escape hatch

| Option | Default | Description |
| --- | --- | --- |
| `attributes` | `{}` | Additional HTML attributes applied to the generated input. On `select`, `attributes.placeholder` is rendered as a disabled placeholder option — see [Input types and editing modes](input-types-and-modes.md#select) |

## Native attributes

A `disabled` attribute on the trigger element itself (no `data-` prefix) starts the widget disabled — equivalent to calling `disable()` right after construction (see [API reference](api-reference.md#disable)):

```html
<a data-type="text" disabled>John Doe</a>
```

Following native HTML boolean-attribute semantics, presence alone means disabled: `disabled`, `disabled=""`, `disabled="disabled"`, `disabled="true"`, and any other value are all treated as disabled. The only explicit opt-outs are `disabled="false"` and `disabled="0"` (case-insensitive).

This is unrelated to `attributes.disabled`, which disables the *generated input* inside the popup/inline editor rather than the trigger itself.

## HTML data attributes

JavaScript options can be represented as `data-*` attributes where the value can be expressed as HTML text.

Common mappings:

| JavaScript | HTML |
| --- | --- |
| `type` | `data-type` |
| `mode` | `data-mode` |
| `value` | `data-value` |
| `name` | `data-name` |
| `title` | `data-title` |
| `url` | `data-url` |
| `required` | `data-required` |
| `emptyText` | `data-empty-text` |
| `showButtons` | `data-show-buttons` |
| `format` | `data-format` |
| `displayFormat` | `data-display-format` |
| `source` | `data-source` — JSON array/object, or an ajax URL string (see [Select](input-types-and-modes.md#select)) |
| `sourceCache` | `data-source-cache` |

Example:

```html
<a data-type="text" data-url="/users/42/name" data-name="name" data-title="Enter Name" data-required="true">
    John Doe
</a>
```

Functions and complex JavaScript objects — `requestBuilder`, `render`, `success`/`error`, `popoverOptions`, `ajaxOptions`, `attributes`, a `source` function — should be configured in JavaScript rather than through HTML attributes.

## Rendering and formatting

The `render` option allows the displayed value to differ from the raw value used by the editor.

For example:

```ts
new Editable(element, {
    type: 'number',
    render(value) {
        return Number(value).toLocaleString();
    },
});
```

This is useful for:

- number formatting;
- currency;
- labels;
- custom display values;
- values that need presentation-specific formatting.

The rendered value is for display only. The editor continues to work with the underlying value.
