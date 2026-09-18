import { describe, expect, it } from 'vitest';
import Editable from '../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('render — final display pass, independent of the stored/input value', () => {
    it('formats the closed-element text without touching the value', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'number',
            value: '30000.00',
            render: (value) => `${value}!`,
        });

        expect(el.textContent).toBe('30000.00!');
    });

    it('the input while editing still receives the raw, unformatted value', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'number',
            value: '30000.00',
            render: (value) => `${parseFloat(value).toLocaleString()}!`,
        });

        el.click();
        await sleep(50);

        const input = document.querySelector<HTMLInputElement>('.popover input[type="number"]');
        expect(input?.value).toBe('30000.00');
    });

    it('reformats after a local save with the new value', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'number',
            value: '1.00',
            render: (value) => `${value}-formatted`,
        });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="number"]');
        if (input) input.value = '2.00';
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(50);

        // native <input type="number"> preserves the exact typed string — it does not
        // normalize "2.00" down to "2"
        expect(el.textContent).toBe('2.00-formatted');
    });

    it('applies to the matched label for select', () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            value: '2',
            source: [{ value: '2', text: 'published' }],
            render: (text) => text.toUpperCase(),
        });

        expect(el.textContent).toBe('PUBLISHED');
    });

    it('is skipped entirely when not provided', () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', value: 'plain' });

        expect(el.textContent).toBe('plain');
    });
});
