import { afterEach, describe, expect, it, vi } from 'vitest';
import Editable from '../src/editable.ts';
import BaseType from '../src/Types/BaseType.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'x';
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('checkUnsupportedOptions — console diagnostics for the wrong type', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('warns when format is passed to a non-date type', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        new Editable(mountTrigger(), { type: 'text', format: 'YYYY-MM-DD' });

        expect(spy).toHaveBeenCalledWith(expect.stringContaining('InputType does not support the "format" option'));
    });

    it('warns when source is passed to a date field', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        new Editable(mountTrigger(), { type: 'date', source: [{ value: '1', text: 'a' }] });

        expect(spy).toHaveBeenCalledWith(expect.stringContaining('DateType does not support the "source" option'));
    });

    it('warns when displayFormat is passed to a select', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        new Editable(mountTrigger(), {
            type: 'select',
            displayFormat: 'x',
            source: [{ value: '1', text: 'a' }],
        });

        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('SelectType does not support the "displayFormat" option'),
        );
    });

    it('stays silent for a correct type/option combination', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        new Editable(mountTrigger(), { type: 'date', format: 'YYYY-MM-DD' });
        new Editable(mountTrigger(), { type: 'select', source: [{ value: '1', text: 'a' }] });

        expect(spy).not.toHaveBeenCalled();
    });
});

describe('route_type() / route_mode() — unknown value errors', () => {
    it('lists the registered types when given an unknown type', () => {
        expect(() => new Editable(mountTrigger(), { type: 'not-a-real-type' })).toThrowError(
            /Type "not-a-real-type" is not registered\. Available types: .*text.*/,
        );
    });

    it('lists the registered modes when given an unknown mode', () => {
        expect(() => new Editable(mountTrigger(), { type: 'text', mode: 'not-a-real-mode' as never })).toThrowError(
            /Mode "not-a-real-mode" is not registered\. Available modes: popup, inline/,
        );
    });
});

describe('BaseType abstract-class guard', () => {
    it('cannot be instantiated directly', () => {
        const inst = new Editable(mountTrigger(), { type: 'text' });
        expect(() => new BaseType(inst)).toThrowError(/BaseType is abstract and cannot be instantiated directly/);
    });
});

describe('config errors vs genuine network failures in the save flow', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('a real network failure (TypeError) is shown to the user', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new TypeError('Failed to fetch');
            }),
        );
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const el = mountTrigger();
        new Editable(el, { type: 'text', url: '/post' });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'changed';
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(50);

        expect(document.querySelector('.popover .editable-error')?.textContent).toBe('Failed to fetch');
    });
});
