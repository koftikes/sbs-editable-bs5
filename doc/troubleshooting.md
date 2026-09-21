# Troubleshooting

## The popover does not appear

Make sure Bootstrap's JavaScript bundle is loaded:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.bundle.min.js"></script>
```

Use the bundle build rather than `bootstrap.min.js` when Popper is required.

## The value is not sent to the server

Check:

1. `url` is configured;
2. the endpoint is correct;
3. the `name` option contains the expected field name;
4. the browser Network panel shows the request;
5. the server accepts the HTTP method and request body.

## `data-*` configuration is ignored

Check the exact attribute name:

```html
data-empty-text="No value"
```

maps to:

```ts
emptyText: 'No value'
```

Functions and objects should be configured from JavaScript.

## A `select`/`autocomplete` opens with nothing selected, even with a placeholder option

This happens when the trigger element's markup uses `&nbsp;` (or other whitespace) as filler text before initialization, e.g.:

```html
<span id="status">&nbsp;</span>
```

A whitespace-only or `&nbsp;`-only trigger is treated as an empty initial `value`, so it matches a placeholder option's `value=""` — this only applies when no `value`/`data-value` is explicitly set. If you actually need a non-breaking space as the initial value, set it explicitly through the `value` option rather than relying on the element's markup.

## The server returns an error

Inspect the browser Network panel and verify the HTTP response status.

The default implementation treats non-`2xx` responses as failed requests.

## The value appears formatted but saves correctly

This is expected when using `render`. Rendering changes the displayed representation and does not replace the underlying value used by the editor.

## Editable elements are duplicated after AJAX updates

Destroy the previous instances before replacing their DOM elements, then initialize the new elements.
