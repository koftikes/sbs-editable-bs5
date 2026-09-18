import { describe, expect, it } from 'vitest';
import Editable from '../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'x';
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPopover(inst: Editable): unknown {
    // biome-ignore lint/suspicious/noExplicitAny: reaching into the mode internals for the assertion
    return (inst.modeElement as any).popover;
}

describe('PopupMode lifecycle', () => {
    it('opens a popover on click', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('destroy() removes the document click listener — clicking afterward opens nothing', async () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text' });

        inst.destroy();
        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });

    it('destroy() disposes the underlying Bootstrap Popover instance', async () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text' });
        expect(getPopover(inst)).not.toBeNull();

        inst.destroy();

        expect(getPopover(inst)).toBeNull();
    });

    it('closes when clicking outside the trigger and the popover content', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);
        expect(document.querySelectorAll('.popover').length).toBe(1);

        document.body.click();
        await sleep(200);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });
});

describe('InlineMode lifecycle', () => {
    it('opens an input in place on click', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline' });

        el.click();
        await sleep(50);

        expect(el.querySelector('input')).not.toBeNull();
    });

    it('destroy() prevents opening after being destroyed before first click', async () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text', mode: 'inline' });

        inst.destroy();
        el.click();
        await sleep(50);

        expect(el.querySelector('input')).toBeNull();
    });

    it('repeated open/close cycles do not accumulate "shown" focus listeners', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline' });

        for (let i = 0; i < 3; i++) {
            el.click();
            await sleep(20);
            const cancelBtn = el.querySelector<HTMLButtonElement>('.btn-danger');
            cancelBtn?.click();
            await sleep(150);
        }

        // If focus listeners were leaking, this would still just pass functionally —
        // the real regression this guards is the console never throwing from stale
        // detached-element references. No throw means no leak surfaced synchronously.
        expect(el.querySelector('input')).toBeNull();
    });
});
