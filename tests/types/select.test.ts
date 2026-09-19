import { afterEach, describe, expect, it, vi } from 'vitest';
import Editable from '../../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('SelectType', () => {
    it('matches a numeric source value against the string value (String() normalization)', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: [
                { value: 1, text: 'Draft' },
                { value: 2, text: 'Published' },
            ],
        });

        expect(el.textContent).toBe('Published');
    });

    it('matches a string source value the same way', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: [
                { value: '1', text: 'Draft' },
                { value: '2', text: 'Published' },
            ],
        });

        expect(el.textContent).toBe('Published');
    });

    it('parses a JSON-string source (the data-source markup path)', () => {
        const el = mountTrigger();
        el.dataset.source = JSON.stringify([{ value: '1', text: 'Only option' }]);
        new Editable(el, { type: 'select', value: '1' });

        expect(el.textContent).toBe('Only option');
    });

    it('throws a descriptive error for invalid JSON in data-source', () => {
        const el = mountTrigger();
        el.id = 'bad-select';
        el.dataset.source = '{not valid json';

        expect(() => new Editable(el, { type: 'select' })).toThrowError(
            /Invalid JSON in "source" option\/data-source attribute on #bad-select/,
        );
    });

    it('falls back to emptyText when the value matches nothing in source', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '99',
            source: [{ value: '1', text: 'Draft' }],
        });

        expect(el.textContent).toBe('Empty');
    });

    it('still throws for invalid JSON that looks like an array', () => {
        const el = mountTrigger();
        el.id = 'bad-array-select';
        el.dataset.source = '[not valid';

        expect(() => new Editable(el, { type: 'select' })).toThrowError(
            /Invalid JSON in "source" option\/data-source attribute on #bad-array-select/,
        );
    });
});

describe('SelectType — additional source shapes', () => {
    it('accepts a plain {value: text} object map', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: { '1': 'Draft', '2': 'Published' },
        });

        expect(el.textContent).toBe('Published');
    });

    it('accepts a flat array of strings (value === text)', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: 'Published',
            source: ['Draft', 'Published'],
        });

        expect(el.textContent).toBe('Published');
    });

    it('matches a value nested inside a group (children)', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: [
                {
                    text: 'Group',
                    children: [
                        { value: '1', text: 'A' },
                        { value: '2', text: 'B' },
                    ],
                },
            ],
        });

        expect(el.textContent).toBe('B');
    });

    it('accepts a function returning the list synchronously', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: () => [
                { value: '1', text: 'Draft' },
                { value: '2', text: 'Published' },
            ],
        });

        expect(el.textContent).toBe('Published');
    });

    it('accepts a function returning a Promise, and updates the label once it resolves', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: async () => {
                await sleep(10);
                return [
                    { value: '1', text: 'Draft' },
                    { value: '2', text: 'Published' },
                ];
            },
        });

        // Not resolved yet — same emptyText fallback as a genuine no-match, by design (see the
        // ListType.initText() discussion this round deferred: no special "still loading" state).
        expect(el.textContent).toBe('Empty');

        await sleep(50);

        expect(el.textContent).toBe('Published');
    });
});

describe('SelectType — rendering (<optgroup>, disabled options)', () => {
    it('renders <optgroup> for children and marks disabled options', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            source: [
                {
                    text: 'Active states',
                    children: [
                        { value: '1', text: 'Draft' },
                        { value: '2', text: 'Published', disabled: true },
                    ],
                },
                { value: '3', text: 'Archived' },
            ],
        });

        el.click();
        await sleep(50);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select).not.toBeNull();

        const group = select?.querySelector('optgroup');
        expect(group?.label).toBe('Active states');

        const groupOptions = [...(group?.querySelectorAll('option') ?? [])];
        expect(groupOptions.map((o) => o.value)).toEqual(['1', '2']);
        expect(groupOptions.find((o) => o.value === '2')?.disabled).toBe(true);
        expect(groupOptions.find((o) => o.value === '1')?.disabled).toBe(false);

        expect(select?.querySelectorAll(':scope > option')).toHaveLength(1);
    });
});

describe('SelectType — placeholder (attributes.placeholder as a disabled prepended option)', () => {
    it('prepends a disabled, empty-value option built from attributes.placeholder', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            attributes: { placeholder: '— Select —' },
            source: [
                { value: '1', text: 'Draft' },
                { value: '2', text: 'Published' },
            ],
        });

        el.click();
        await sleep(50);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        const options = [...(select?.querySelectorAll<HTMLOptionElement>(':scope > option') ?? [])];

        expect(options).toHaveLength(3);
        expect(options[0].value).toBe('');
        expect(options[0].textContent).toBe('— Select —');
        expect(options[0].disabled).toBe(true);
    });

    it('does not appear when attributes.placeholder is not set', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'select', source: [{ value: '1', text: 'Draft' }] });

        el.click();
        await sleep(50);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.querySelectorAll(':scope > option')).toHaveLength(1);
    });

    it('is selected by default when no value is configured', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            attributes: { placeholder: '— Select —' },
            source: [{ value: '1', text: 'Draft' }],
        });

        el.click();
        await sleep(50);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.value).toBe('');
    });

    it('is not selected when a real value is configured', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '1',
            attributes: { placeholder: '— Select —' },
            source: [{ value: '1', text: 'Draft' }],
        });

        el.click();
        await sleep(50);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.value).toBe('1');
    });

    it('combined with required, blocks native form submission while unselected', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            required: true,
            attributes: { placeholder: '— Select —' },
            source: [{ value: '1', text: 'Draft' }],
        });

        el.click();
        await sleep(50);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.checkValidity()).toBe(false);
    });

    it('does not affect the trigger label — emptyText still governs it when the value is empty', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            attributes: { placeholder: '— Select —' },
            source: [{ value: '1', text: 'Draft' }],
        });

        expect(el.textContent).toBe('Empty');
    });
});

describe('SelectType — source as an ajax URL', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    // Each test below uses its own URL — ListSource.ts caches responses by URL for the lifetime
    // of the module, so a reused URL would silently hit an earlier test's cache.

    it('fetches the list (GET, no body) and renders it once resolved', async () => {
        const fetchMock = vi.fn(
            async () =>
                new Response(
                    JSON.stringify([
                        { value: '1', text: 'Draft' },
                        { value: '2', text: 'Published' },
                    ]),
                    { status: 200 },
                ),
        );
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'select', value: '2', source: '/api/select-test/statuses' });

        expect(fetchMock).toHaveBeenCalledWith('/api/select-test/statuses', { method: 'GET' });
        expect(el.textContent).toBe('Empty'); // not resolved yet

        await sleep(30);

        expect(el.textContent).toBe('Published');
    });

    it('treats a data-source string that is not JSON as an ajax URL', async () => {
        const fetchMock = vi.fn(
            async () => new Response(JSON.stringify([{ value: '1', text: 'Only' }]), { status: 200 }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        el.dataset.source = '/api/select-test/from-data-attr';
        new Editable(el, { type: 'select', value: '1' });

        await sleep(30);

        expect(fetchMock).toHaveBeenCalledWith('/api/select-test/from-data-attr', { method: 'GET' });
        expect(el.textContent).toBe('Only');
    });

    it('caches a response by URL across fields when sourceCache is not disabled', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ value: '1', text: 'A' }]), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        new Editable(mountTrigger(), { type: 'select', source: '/api/select-test/shared' });
        new Editable(mountTrigger(), { type: 'select', source: '/api/select-test/shared' });

        await sleep(30);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('bypasses the cache when sourceCache is false', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ value: '1', text: 'A' }]), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        new Editable(mountTrigger(), { type: 'select', source: '/api/select-test/uncached', sourceCache: false });
        new Editable(mountTrigger(), { type: 'select', source: '/api/select-test/uncached', sourceCache: false });

        await sleep(30);

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('shows an error and hides the loader if the ajax source fails', async () => {
        // The fetch only resolves once we call resolveFetch() below — opening the popover first
        // (and letting its `hideError()` on show.bs.popover settle) removes any race with the
        // ajax failure landing before/after that reset.
        let resolveFetch!: (response: Response) => void;
        const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)));
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const el = mountTrigger();
        new Editable(el, { type: 'select', source: '/api/select-test/broken' });

        el.click();
        await sleep(50);

        resolveFetch(new Response('', { status: 500, statusText: 'Internal Server Error' }));
        await sleep(50);

        const errorEl = document.querySelector('.popover .editable-error');
        expect(errorEl?.textContent).toBe('500 Internal Server Error');
        expect(errorEl?.hasAttribute('hidden')).toBe(false);
        expect(document.querySelector('.popover .editable-load-overlay')?.hasAttribute('hidden')).toBe(true);
    });
});

describe('SelectType — re-syncs value / retries on reopen', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('re-syncs the <select> value once an ajax source resolves after the popover is already open', async () => {
        let resolveFetch!: (data: unknown) => void;
        const fetchMock = vi.fn(
            () =>
                new Promise<Response>((resolve) => {
                    resolveFetch = (data) => resolve(new Response(JSON.stringify(data), { status: 200 }));
                }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'select', value: '2', source: '/api/select-test/resync' });

        el.click();
        await sleep(50); // popover open — event_show() already ran .value = '2' against an empty <select>

        resolveFetch([
            { value: '1', text: 'Draft' },
            { value: '2', text: 'Published' },
        ]);
        await sleep(30);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.value).toBe('2');
    });

    it('re-shows a fresh error on reopen instead of leaving a stale hidden one', async () => {
        const fetchMock = vi.fn(async () => new Response('', { status: 500, statusText: 'Internal Server Error' }));
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const el = mountTrigger();
        new Editable(el, { type: 'select', source: '/api/select-test/retry-error' });

        // Fails once in the background, before the popover is ever opened.
        await sleep(30);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        el.click();
        await sleep(50);

        // event_show() hid the stale error, but onShow() retried immediately — it's back, fresh.
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const errorEl = document.querySelector('.popover .editable-error');
        expect(errorEl?.textContent).toBe('500 Internal Server Error');
        expect(errorEl?.hasAttribute('hidden')).toBe(false);
    });

    it('recovers on reopen once the retried source succeeds', async () => {
        let call = 0;
        const fetchMock = vi.fn(async () => {
            call += 1;
            if (call === 1) return new Response('', { status: 500, statusText: 'Internal Server Error' });
            return new Response(JSON.stringify([{ value: '1', text: 'Draft' }]), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const el = mountTrigger();
        new Editable(el, { type: 'select', value: '1', source: '/api/select-test/retry-recover' });

        await sleep(30); // first attempt fails in the background

        el.click();
        await sleep(50); // onShow() retries — this one succeeds

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(document.querySelector('.popover .editable-error')?.hasAttribute('hidden')).toBe(true);

        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.querySelectorAll<HTMLOptionElement>(':scope > option')).toHaveLength(1);
        expect(select?.value).toBe('1');
    });
});

describe('SelectType — inline mode, loading overlay covers the control', () => {
    it('positions the overlay over the <select> (regression: .editable-form had no positioned ancestor)', async () => {
        let resolveFetch!: (data: Array<{ value: string; text: string }>) => void;
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            mode: 'inline',
            source: () =>
                new Promise<Array<{ value: string; text: string }>>((resolve) => {
                    resolveFetch = resolve;
                }),
        });

        el.click();
        await sleep(50);

        const overlay = el.querySelector<HTMLElement>('.editable-load-overlay');
        const form = el.querySelector<HTMLElement>('.editable-form');
        expect(overlay).not.toBeNull();
        expect(form).not.toBeNull();

        // The overlay is `position: absolute`; for it to actually cover the form (not the
        // nearest *other* positioned ancestor, or the viewport if there is none), .editable-form
        // itself has to be its offsetParent — i.e. the nearest positioned ancestor.
        expect(overlay?.offsetParent).toBe(form);

        resolveFetch([{ value: '1', text: 'Draft' }]);
        await sleep(30);
    });
});
