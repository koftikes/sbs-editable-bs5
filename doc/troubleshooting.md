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
2. `send` is enabled;
3. the endpoint is correct;
4. the `name` option contains the expected field name;
5. the browser Network panel shows the request;
6. the server accepts the HTTP method and request body.

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

## The server returns an error

Inspect the browser Network panel and verify the HTTP response status.

The default implementation treats non-`2xx` responses as failed requests.

## The value appears formatted but saves correctly

This is expected when using `render`. Rendering changes the displayed representation and does not replace the underlying value used by the editor.

## Editable elements are duplicated after AJAX updates

Destroy the previous instances before replacing their DOM elements, then initialize the new elements.
