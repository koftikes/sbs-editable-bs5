import { describe, expect, it } from 'vitest';
import Editable from '../../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    document.body.append(el);
    return el;
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
});
