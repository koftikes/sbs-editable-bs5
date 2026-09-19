# Options reference

Options can be supplied either through JavaScript or, where supported, through `data-*` attributes.

## Core

| Option | Description |
| --- | --- |
| `type` | Input type used for editing |
| `mode` | Editing mode, such as popup or inline |
| `value` | Initial value |
| `name` | Field name sent to the server |
| `title` | Editor title |
| `required` | Enables required-value validation |

## Display

| Option | Description |
| --- | --- |
| `emptyText` | Text displayed when the value is empty |
| `showButtons` | Controls save/cancel buttons |
| `popoverOptions` | Bootstrap popover configuration |
| `render` | Converts the value into its display representation |

## Networking

| Option | Description |
| --- | --- |
| `url` | Server endpoint or dynamic URL function |
| `send` | Controls whether a server request is performed |
| `ajaxOptions` | Additional options for the default request |
| `requestBuilder` | Fully replaces the default request — see [Server integration](server-integration.md) |

## Callbacks

| Option | Description |
| --- | --- |
| `success` | Called after a successful save |
| `error` | Called when saving fails |

## `type: 'date'` / `type: 'datetime'` only

| Option | Description |
| --- | --- |
| `format` | Value format sent to/from the server (day.js tokens) |
| `displayFormat` | Format used for the value shown on the trigger |

## `type: 'select'` only

| Option | Description |
| --- | --- |
| `source` | The option list — array, `{value: text}` map, ajax URL, or a function. See [Input types and editing modes](input-types-and-modes.md#select) |
| `sourceCache` | Cache an ajax `source` response by URL across fields on the page. Default: `true` |

## Escape hatch

| Option | Description |
| --- | --- |
| `attributes` | Additional HTML attributes applied to the generated input. On `select`, `attributes.placeholder` is rendered as a disabled placeholder option — see [Input types and editing modes](input-types-and-modes.md#select) |

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
