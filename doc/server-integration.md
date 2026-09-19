# Server integration

## Default request

A basic server-side configuration:

```ts
new Editable(element, {
    type: 'text',
    name: 'username',
    url: '/users/42/username',
});
```

The server should return a successful HTTP status (`2xx`) when the value has been accepted. 

Non-`2xx` responses are treated as errors.

## JSON response

The response can contain data used by the `success` callback:

```ts
new Editable(element, {
    url: '/users/42/username',
    success(response) {
        console.log('Saved:', response);
    },
    error(error) {
        console.error('Save failed:', error);
    },
});
```

The exact response format is intentionally not imposed by the library. Your backend can return the JSON structure appropriate for your application.

## Dynamic URLs

The URL can be generated dynamically:

```ts
new Editable(element, {
    url: (context, newValue) => {
        return `/users/${context.element.dataset.userId}/username`;
    },
});
```

This is useful when the endpoint depends on the current element or the new value.

## Custom requests

Use `requestBuilder` when the default `POST` + `FormData` request is not sufficient.

For example, to send JSON with `PUT`:

```ts
new Editable(element, {
    url: '/api/users/42/username',
    requestBuilder: async ({ url, value }) => {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: value,
            }),
        });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response;
    },
});
```

`requestBuilder` completely replaces the default request handling. When it is used, configure the request yourself, including the HTTP method, headers, body, credentials, and response handling required by your application.

## CSRF protection

For applications using CSRF tokens, the token can be added in a custom request:

```ts
new Editable(element, {
    url: '/users/42/username',

    requestBuilder: async ({ url, value }) => {
        const token    = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token ?? '',
            },
            body: JSON.stringify({
                value,
            }),
        });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response;
    },
});
```

The exact CSRF mechanism depends on your backend framework.
