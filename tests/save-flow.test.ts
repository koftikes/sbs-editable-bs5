import { afterEach, describe, expect, it, vi } from 'vitest';
import Editable from '../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'initial';
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submit(el: HTMLAnchorElement, newValue: string): Promise<void> {
    el.click();
    await sleep(50);
    const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
    if (!input) throw new Error('input not found');
    input.value = newValue;
    document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
    await sleep(50);
}

describe('local-only saves — no request is ever sent', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('send: false skips ajax entirely even though url is set', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'text', url: '/post', send: false });

        await submit(el, 'local value');

        expect(fetchMock).not.toHaveBeenCalled();
        expect(el.textContent).toBe('local value');
    });

    it('no url configured also skips ajax and saves locally', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        await submit(el, 'local value');

        expect(fetchMock).not.toHaveBeenCalled();
        expect(el.textContent).toBe('local value');
    });
});

describe('server responded, but not ok', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('falls back to "status statusText" when there is no error handler', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response('', { status: 500, statusText: 'Server Error' })),
        );

        const el = mountTrigger();
        new Editable(el, { type: 'text', url: '/post' });

        await submit(el, 'changed');

        expect(document.querySelector('.popover .editable-error')?.textContent).toBe('500 Server Error');
        // the popup stays open and the value is not committed on failure
        expect(el.textContent).toBe('initial');
    });

    it('uses the message from a custom error() callback instead of the default', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response('', { status: 400, statusText: 'Bad Request' })),
        );

        const el = mountTrigger();
        new Editable(el, {
            type: 'text',
            url: '/post',
            error: async () => 'This value is not allowed',
        });

        await submit(el, 'changed');

        expect(document.querySelector('.popover .editable-error')?.textContent).toBe('This value is not allowed');
    });
});

describe('server responded ok, but success() rejects the value', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('a message returned from success() is shown as an error and the value is not committed', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response('', { status: 200 })),
        );

        const el = mountTrigger();
        new Editable(el, {
            type: 'text',
            url: '/post',
            success: async () => 'Needs moderator review',
        });

        await submit(el, 'changed');

        expect(document.querySelector('.popover .editable-error')?.textContent).toBe('Needs moderator review');
        expect(document.querySelectorAll('.popover').length).toBe(1);
        expect(el.textContent).toBe('initial');
    });
});

describe('ajaxOptions — merged with the {method: "POST"} default', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('user-supplied headers and method override/extend the default', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, {
            type: 'text',
            url: '/post',
            ajaxOptions: { method: 'PUT', headers: { 'X-Custom': 'yes' } },
        });

        await submit(el, 'changed');

        const init = fetchMock.mock.calls[0][1];
        if (!init) throw new Error('fetch was not called with init');
        expect(init.method).toBe('PUT');
        expect((init.headers as Record<string, string>)['X-Custom']).toBe('yes');
        expect(init.body).toBeInstanceOf(FormData);
    });
});

describe('showButtons: false — auto-submits on native change instead', () => {
    it('renders no buttons and saves as soon as the input fires change', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', showButtons: false });

        el.click();
        await sleep(50);

        expect(document.querySelector('.popover button.btn-success')).toBeNull();
        expect(document.querySelector('.popover button.btn-danger')).toBeNull();

        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (!input) throw new Error('input not found');
        input.value = 'auto-saved';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(50);

        expect(el.textContent).toBe('auto-saved');
    });
});

describe('required — top-level option applied to the generated element', () => {
    it('sets element.required on the input', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', required: true });

        el.click();
        await sleep(50);

        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        expect(input?.required).toBe(true);
    });
});
