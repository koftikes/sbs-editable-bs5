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

describe('.disable() / .enable() — widget-level (blocks the trigger itself)', () => {
    it('new instances start enabled — there is no init-time option for this', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('disable() blocks the trigger entirely — clicking opens nothing', async () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text' });

        inst.disable();
        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });

    it('enable() after disable() restores the trigger', async () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text' });

        inst.disable();
        inst.enable();
        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('disable() also blocks the trigger in inline mode', async () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text', mode: 'inline' });

        inst.disable();
        el.click();
        await sleep(50);

        expect(el.querySelector('input')).toBeNull();
    });
});

describe('native `disabled` attribute on the trigger — equivalent to calling disable() at init', () => {
    it('bare `disabled` attribute (no value) starts disabled', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', '');
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });

    it('disabled="disabled" starts disabled', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', 'disabled');
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });

    it('disabled="true" starts disabled', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', 'true');
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });

    it('disabled="false" is an explicit opt-out — trigger opens normally', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', 'false');
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('disabled="0" is an explicit opt-out — trigger opens normally', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', '0');
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('unrecognized values fall back to disabled, matching native presence-only semantics', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', 'yes-please');
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(0);
    });

    it('enable() after a native disabled attribute restores the trigger', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', '');
        const inst = new Editable(el, { type: 'text' });

        inst.enable();
        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('also applies in inline mode', async () => {
        const el = mountTrigger();
        el.setAttribute('disabled', '');
        new Editable(el, { type: 'text', mode: 'inline' });

        el.click();
        await sleep(50);

        expect(el.querySelector('input')).toBeNull();
    });
});

describe('attributes.disabled — input-level only, independent of the above', () => {
    it('the trigger still opens normally', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', attributes: { disabled: true } });

        el.click();
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('the generated input is natively disabled', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', attributes: { disabled: true } });

        el.click();
        await sleep(50);

        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        expect(input?.disabled).toBe(true);
    });
});
