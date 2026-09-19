# API reference

## Methods

### `enable()`

Enables editing.

```ts
editable.enable();
```

### `disable()`

Disables editing.

```ts
editable.disable();
```

### `getValue()`

Returns the current value.

```ts
const value = editable.getValue();
```

### `setValue(value)`

Sets the current value.

```ts
editable.setValue('John Doe');
```

### `getOption(name)`

Returns an option value.

```ts
const type = editable.getOption('type');
```

### `destroy()`

Removes the editable instance and its event handlers.

```ts
editable.destroy();
```

Call `destroy()` before removing an initialized element from the DOM or before initializing another instance on the same element.

## Dynamic content

If editable elements are inserted dynamically, initialize them after adding them to the DOM:

```ts
const element = document.createElement('a');

element.textContent = 'John Doe';
element.dataset.type = 'text';

container.append(element);

new Editable(element);
```

When dynamically replacing or removing initialized elements, destroy the corresponding instance first:

```ts
editable.destroy();
element.remove();
```

This prevents stale event handlers and duplicated instances.

## TypeScript

The package includes TypeScript declarations:

```ts
import Editable from '@sbsweb/editable-bs5';

const editable: Editable = new Editable(element, {
    type: 'text',
});
```

The public API is typed and can be used directly from TypeScript projects.
