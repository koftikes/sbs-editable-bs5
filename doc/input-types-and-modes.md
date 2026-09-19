# Input types and editing modes

## Input types

The library provides several built-in input types.

### Text

```html
<a data-type="text">John Doe</a>
```

### Textarea

```html
<a data-type="textarea">A longer description</a>
```

### Number

```html
<a data-type="number">1500</a>
```

### Select

`source` accepts several shapes:

```ts
// Array of {value, text} — disabled options are supported
new Editable(element, {
    type: 'select',
    source: [
        { value: 'active', text: 'Active' },
        { value: 'inactive', text: 'Inactive', disabled: true },
    ],
});

// {value: text} map
new Editable(element, { type: 'select', source: { active: 'Active', inactive: 'Inactive' } });

// Flat array of strings — value === text
new Editable(element, { type: 'select', source: ['Active', 'Inactive'] });

// A function — sync or returning a Promise
new Editable(element, {
    type: 'select',
    source: (context) => fetch(`/api/statuses?locale=${context.element.dataset.locale}`).then((r) => r.json()),
});

// An ajax URL — GET, JSON response in any of the shapes above
new Editable(element, { type: 'select', source: '/api/statuses' });
```

`<optgroup>` is rendered from a `children` array:

```ts
new Editable(element, {
    type: 'select',
    source: [
        { text: 'Active states', children: [{ value: 1, text: 'Draft' }, { value: 2, text: 'Published' }] },
        { value: 3, text: 'Archived' },
    ],
});
```

An ajax `source` shows the same loading overlay used while saving, and — since the list isn't known yet when the trigger first renders — the trigger shows `emptyText` until the response arrives and the label can be resolved. Responses are cached by URL across fields on the page (`sourceCache`, default `true`); set `sourceCache: false` to always re-fetch.

A `<select>` has no native `placeholder` attribute, so `attributes.placeholder` is rendered instead as a disabled, empty-value option prepended to the list — selected by default whenever no value is set:

```ts
new Editable(element, {
    type: 'select',
    required: true,
    attributes: { placeholder: '— Select —' },
    source: [{ value: 'active', text: 'Active' }],
});
```

`disabled` only stops the placeholder from being picked again once a real value is chosen — it doesn't by itself block saving an empty value. Pair it with `required` for that: native browser validation then refuses to submit while the placeholder is still selected.

### Date

```ts
new Editable(element, {
    type: 'date',
    format: 'YYYY-MM-DD',
    displayFormat: 'DD.MM.YYYY',
});
```

### Datetime

```ts
new Editable(element, {
    type: 'datetime',
    format: 'YYYY-MM-DD HH:mm',
    displayFormat: 'DD.MM.YYYY HH:mm',
});
```

### Native input types

Native HTML input types can be used when the browser's built-in input UI and validation are appropriate.

Additional attributes can be supplied through `attributes`:

```ts
new Editable(element, {
    type: 'number',
    attributes: { min: '0', max: '100', step: '1'},
});
```

## Editing modes

The editor supports different presentation modes.

### Popup

The editor is displayed in a Bootstrap popover.

```ts
new Editable(element, {
    mode: 'popup',
});
```

### Inline

The editor is displayed directly in the document flow.

```ts
new Editable(element, {
    mode: 'inline',
});
```
