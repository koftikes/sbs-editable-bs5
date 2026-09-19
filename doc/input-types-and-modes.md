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

```ts
new Editable(element, {
    type: 'select',
    source: [
        { value: 'active', text: 'Active' },
        { value: 'inactive', text: 'Inactive' },
    ],
});
```

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
