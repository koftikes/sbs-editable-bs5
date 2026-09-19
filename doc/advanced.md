# Advanced usage

## Events

The component exposes lifecycle events for:

- `init`
- `show`
- `shown`
- `hide`
- `hidden`
- `save`

Use events when application code needs to react to editor lifecycle changes.

The event detail contains the `Editable` instance, allowing application code to access its current state and methods.

## Extensibility

Custom input types can be registered using `BaseType` and `registerType`.

Custom editing modes can be registered using `BaseMode` and `registerMode`.

This allows the built-in editor architecture to be extended without modifying the package source.

## Accessibility

For accessible editable controls:

- prefer semantic interactive elements such as `<button>` or links where appropriate;
- make sure editable elements are keyboard reachable;
- provide meaningful `title` or accessible text;
- do not rely on color alone to communicate validation state;
- use `required` and native input attributes where they provide useful validation;
- ensure dynamically created controls remain accessible to keyboard and assistive-technology users.

The library does not replace application-level accessibility testing.
