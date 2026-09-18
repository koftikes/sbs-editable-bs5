import { afterEach, describe, expect, it, vi } from 'vitest';
import Editable from '../src/editable.ts';

function mountTrigger(attrs: Record<string, string> = {}): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'initial';
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
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

describe('name resolution (no pk — FormData key comes from name/id/"value")', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('uses an explicit data-name over the id', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger({ 'data-name': 'amount', 'data-url': '/post' });
        el.id = 'should-not-be-used';
        new Editable(el, { type: 'text' });

        await submit(el, 'v1');

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect([...body.keys()]).toEqual(['amount']);
        expect(body.get('amount')).toBe('v1');
    });

    it('falls back to the element id when no name is set', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger({ 'data-url': '/post' });
        el.id = 'username';
        new Editable(el, { type: 'text' });

        await submit(el, 'v1');

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect([...body.keys()]).toEqual(['username']);
    });

    it('falls back to the literal key "value" when neither name nor id is set', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger({ 'data-url': '/post' });
        new Editable(el, { type: 'text' });

        await submit(el, 'v1');

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect([...body.keys()]).toEqual(['value']);
    });

    it('never sends a "pk" field — the option does not exist anymore', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger({ 'data-url': '/post', 'data-name': 'amount' });
        // biome-ignore lint/suspicious/noExplicitAny: intentionally passing a legacy field that no longer exists on Options
        new Editable(el, { type: 'text', pk: 1 } as any);

        await submit(el, 'v1');

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect(body.has('pk')).toBe(false);
    });
});

describe('url as a function', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is resolved per-submit with the instance and the new value', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        el.dataset.recordId = '42';
        new Editable(el, {
            type: 'text',
            url: (ctx, newValue) => `/api/records/${ctx.element.dataset.recordId}?v=${newValue}`,
        });

        await submit(el, 'hello');

        expect(fetchMock.mock.calls[0][0]).toBe('/api/records/42?v=hello');
    });
});

describe('requestBuilder', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fully replaces the default FormData request', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, {
            type: 'text',
            url: '/api/rb',
            requestBuilder: (_ctx, newValue, url) => ({
                url,
                init: {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: newValue }),
                },
            }),
        });

        await submit(el, 'hi');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/rb');
        expect(init?.method).toBe('PUT');
        expect(init?.body).toBe(JSON.stringify({ value: 'hi' }));
    });
});
