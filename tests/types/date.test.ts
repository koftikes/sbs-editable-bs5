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

describe('DateType', () => {
    it('accepts an ISO value directly into a native date input', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'date', value: '2026-09-18' });

        el.click();
        await sleep(50);

        const input = document.querySelector<HTMLInputElement>('.popover input[type="date"]');
        expect(input?.value).toBe('2026-09-18');
    });

    it('displayFormat controls the closed-element text independently of format', () => {
        // `value` (when given explicitly, same as text read from markup) is parsed
        // using displayFormat, then re-serialized as format for storage — so it must
        // be provided here in displayFormat's shape, not format's.
        const el = mountTrigger();
        new Editable(el, {
            type: 'date',
            value: '18.09.2026',
            format: 'YYYY-MM-DD',
            displayFormat: 'DD.MM.YYYY',
        });

        expect(el.textContent).toBe('18.09.2026');
    });

    it('round-trips a value read back via getValue() when format differs from displayFormat', () => {
        // getValue() returns the internally-stored value, which is in `format`'s shape — not
        // displayFormat's. Destroying an instance and reconstructing another one from that
        // value (e.g. after a mode switch) must not corrupt it.
        const el = mountTrigger();
        const first = new Editable(el, {
            type: 'date',
            value: '18.09.2026',
            format: 'YYYY-MM-DD',
            displayFormat: 'DD.MM.YYYY',
        });
        const stored = first.getValue();
        first.destroy();

        new Editable(el, {
            type: 'date',
            value: stored,
            format: 'YYYY-MM-DD',
            displayFormat: 'DD.MM.YYYY',
        });

        expect(el.textContent).toBe('18.09.2026');
    });
});

describe('DateTimeType', () => {
    it('defaults to the datetime-local-compatible T-separated format', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'datetime', value: '2026-09-18T14:30' });

        el.click();
        await sleep(50);

        const input = document.querySelector<HTMLInputElement>('.popover input[type="datetime-local"]');
        // A space-separated value would leave this input empty (native browser behavior) —
        // this is the regression the "YYYY-MM-DDTHH:mm" default guards against.
        expect(input?.value).toBe('2026-09-18T14:30');
    });
});
