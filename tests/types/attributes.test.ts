import { describe, expect, it } from 'vitest';
import Editable from '../../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('attributes — generalized to every type, not just InputType', () => {
    it('applies to a textarea', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'textarea',
            attributes: { placeholder: 'Comment', maxlength: 200 },
        });

        el.click();
        await sleep(50);
        const textarea = document.querySelector<HTMLTextAreaElement>('.popover textarea');
        expect(textarea?.placeholder).toBe('Comment');
        expect(textarea?.maxLength).toBe(200);
    });

    it('applies to a select', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'select',
            source: [{ value: '1', text: 'a' }],
            attributes: { required: true },
        });

        el.click();
        await sleep(50);
        const select = document.querySelector<HTMLSelectElement>('.popover select');
        expect(select?.required).toBe(true);
    });

    it('applies to a date input', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'date', attributes: { placeholder: 'pick one' } });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="date"]');
        expect(input?.placeholder).toBe('pick one');
    });
});

describe('attributes.name / attributes.value — removed from the allowlist', () => {
    it('does not set a name attribute on the generated element', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', attributes: { name: 'ignored' } });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        expect(input?.getAttribute('name')).toBeNull();
    });

    it('does not set a value attribute on the generated element', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', value: 'real', attributes: { value: 'ignored' } });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        expect(input?.getAttribute('value')).toBeNull();
        expect(input?.value).toBe('real');
    });
});
