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

const USERS = [
    { value: '42', text: 'Alice Johnson' },
    { value: '17', text: 'Bob Smith' },
    { value: '9', text: 'Bobby Fischer' },
];

describe('AutocompleteType — closed trigger label', () => {
    it('shows the matching label for the current value', () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', value: '17', source: USERS });

        expect(el.textContent).toBe('Bob Smith');
    });

    it('falls back to emptyText when the value matches nothing (strict mode, default)', () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', value: '999', source: USERS });

        expect(el.textContent).toBe('N/A');
    });

    it('shows the raw value when it matches nothing and allowCustomValue is set', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'autocomplete',
            value: 'Freetown',
            allowCustomValue: true,
            source: ['Berlin', 'Bern'],
        });

        expect(el.textContent).toBe('Freetown');
    });

    it('shows emptyText when the value is empty', () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        expect(el.textContent).toBe('N/A');
    });
});

describe('AutocompleteType — opening the editor', () => {
    it('populates the input with the label, not the raw value', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', value: '17', source: USERS });

        el.click();
        await sleep(50);

        expect(document.querySelector<HTMLInputElement>('.popover input[type="text"]')?.value).toBe('Bob Smith');
    });
});

describe('AutocompleteType — filtering', () => {
    it('shows no suggestions below the threshold (default: 2)', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'B';
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        expect(document.querySelector('.popover .dropdown-menu')?.classList.contains('show')).toBe(false);
    });

    it('matches case- and diacritic-insensitively', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: [{ value: '1', text: 'Émile Zola' }] });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'emile';
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        expect(document.querySelectorAll('.popover .dropdown-item')).toHaveLength(1);
    });

    it('caps the number of suggestions at maxItems', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', maxItems: 1, source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'bob'; // matches both Bob Smith and Bobby Fischer
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        expect(document.querySelectorAll('.popover .dropdown-item')).toHaveLength(1);
    });

    it('treats an unset maxItems as unlimited, not zero suggestions', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'bob'; // matches both Bob Smith and Bobby Fischer
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        expect(document.querySelectorAll('.popover .dropdown-item')).toHaveLength(2);
    });

    it('treats maxItems: 0 as unlimited too, not zero suggestions', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', maxItems: 0, source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'bob'; // matches both Bob Smith and Bobby Fischer
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        expect(document.querySelectorAll('.popover .dropdown-item')).toHaveLength(2);
    });

    it('highlights the matched substring with <mark>', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'bob';
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        const mark = document.querySelector('.popover .dropdown-item mark');
        expect(mark?.textContent?.toLowerCase()).toBe('bob');
    });
});

describe('AutocompleteType — selecting a suggestion', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('clicking a suggestion fills the input with its label and closes the menu', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'bob smith';
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        const item = [...document.querySelectorAll<HTMLButtonElement>('.popover .dropdown-item')].find(
            (el2) => el2.textContent === 'Bob Smith',
        );
        item?.click();
        await sleep(30);

        expect(input?.value).toBe('Bob Smith');
        expect(document.querySelector('.popover .dropdown-menu')?.classList.contains('show')).toBe(false);
    });

    it('submits the selected value, not the displayed label', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', name: 'user_id', url: '/post', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'bob smith';
        input?.dispatchEvent(new Event('input'));
        await sleep(30);

        [...document.querySelectorAll<HTMLButtonElement>('.popover .dropdown-item')]
            .find((el2) => el2.textContent === 'Bob Smith')
            ?.click();
        await sleep(30);
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(50);

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect(body.get('user_id')).toBe('17');
    });
});

describe('AutocompleteType — value resolution on submit (strict mode, default)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects typed text that matches nothing — no request is sent, value stays the same', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', value: '17', url: '/post', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'totally made up';
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(50);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(el.textContent).toBe('Bob Smith');
    });

    it('accepts text typed by hand that exactly matches a label, without clicking it', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', value: '17', name: 'user_id', url: '/post', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'alice johnson'; // different case, never clicked/arrowed
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(50);

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect(body.get('user_id')).toBe('42');
    });

    it('accepts anything when allowCustomValue is set', async () => {
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const el = mountTrigger();
        new Editable(el, {
            type: 'autocomplete',
            value: 'Berlin',
            allowCustomValue: true,
            url: '/post',
            source: ['Berlin', 'Bern'],
        });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'Freetown';
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(50);

        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect(body.get('value')).toBe('Freetown');
    });
});

describe('AutocompleteType — keyboard', () => {
    it('ArrowDown highlights a suggestion without moving DOM focus off the input', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) {
            input.value = 'bob';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await sleep(20);

        expect(document.querySelector('.popover .dropdown-item.active')).not.toBeNull();
        expect(document.activeElement).toBe(input);
    });

    it('Enter selects the highlighted suggestion', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) {
            input.value = 'bob smith';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        await sleep(20);
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await sleep(20);

        expect(input?.value).toBe('Bob Smith');
    });

    it('Escape closes only the suggestion menu, not the whole editor', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) {
            input.value = 'bob';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);
        expect(document.querySelector('.popover .dropdown-menu')?.classList.contains('show')).toBe(true);

        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        await sleep(30);

        expect(document.querySelector('.popover .dropdown-menu')?.classList.contains('show')).toBe(false);
        expect(document.querySelectorAll('.popover')).toHaveLength(1);
    });

    it('reopens the suggestion menu on refocus when the text still meets threshold', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) {
            input.value = 'bob';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);

        input?.dispatchEvent(new Event('blur'));
        await sleep(10);
        expect(document.querySelector('.popover .dropdown-menu')?.classList.contains('show')).toBe(false);

        input?.dispatchEvent(new Event('focus'));
        await sleep(10);
        expect(document.querySelector('.popover .dropdown-menu')?.classList.contains('show')).toBe(true);
    });
});

describe('AutocompleteType — ARIA combobox semantics', () => {
    it('wires up role=combobox/listbox/option and aria-controls on open', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        const menu = document.querySelector<HTMLDivElement>('.popover .dropdown-menu');

        expect(input?.getAttribute('role')).toBe('combobox');
        expect(input?.getAttribute('aria-autocomplete')).toBe('list');
        expect(input?.getAttribute('aria-expanded')).toBe('false');
        expect(menu?.getAttribute('role')).toBe('listbox');
        expect(input?.getAttribute('aria-controls')).toBe(menu?.id);
    });

    it('toggles aria-expanded and stamps role=option on suggestions while filtering', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) {
            input.value = 'bob';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);

        expect(input?.getAttribute('aria-expanded')).toBe('true');
        const items = document.querySelectorAll<HTMLButtonElement>('.popover .dropdown-item');
        expect(items).toHaveLength(2);
        items.forEach((item) => {
            expect(item.getAttribute('role')).toBe('option');
            expect(item.id).not.toBe('');
        });
    });

    it('points aria-activedescendant at the highlighted option and clears it on close', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', source: USERS });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) {
            input.value = 'bob';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await sleep(20);

        const active = document.querySelector<HTMLButtonElement>('.popover .dropdown-item.active');
        expect(active?.getAttribute('aria-selected')).toBe('true');
        expect(input?.getAttribute('aria-activedescendant')).toBe(active?.id);

        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        await sleep(30);

        expect(input?.getAttribute('aria-expanded')).toBe('false');
        expect(input?.hasAttribute('aria-activedescendant')).toBe(false);
    });
});

describe('AutocompleteType — ajax/async source (inherited from ListType)', () => {
    it('resolves an async source and shows the correct label once it does', async () => {
        const el = mountTrigger();
        let resolveIt!: (data: typeof USERS) => void;
        new Editable(el, {
            type: 'autocomplete',
            value: '17',
            source: () =>
                new Promise<typeof USERS>((resolve) => {
                    resolveIt = resolve;
                }),
        });

        expect(el.textContent).toBe('N/A'); // not resolved yet

        resolveIt(USERS);
        await sleep(30);

        expect(el.textContent).toBe('Bob Smith');
    });
});

describe('AutocompleteType — inline mode', () => {
    it('selecting a suggestion and saving works the same as in popup mode', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', mode: 'inline', value: '17', source: USERS });

        el.click();
        await sleep(50);
        const input = el.querySelector<HTMLInputElement>('input[type="text"]');
        expect(input?.value).toBe('Bob Smith');

        if (input) {
            input.value = 'alice';
            input.dispatchEvent(new Event('input'));
        }
        await sleep(30);
        el.querySelector<HTMLButtonElement>('.dropdown-item')?.click();
        await sleep(30);
        el.querySelector<HTMLButtonElement>('button.btn-success')?.click();
        await sleep(200);

        expect(el.textContent).toBe('Alice Johnson');
    });

    it('shows the correct closed label immediately for a synchronous source (create() has not run yet)', () => {
        const el = mountTrigger();
        new Editable(el, { type: 'autocomplete', mode: 'inline', value: '17', source: USERS });

        expect(el.textContent).toBe('Bob Smith');
    });
});
