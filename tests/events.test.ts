import { describe, expect, it } from 'vitest';
import Editable from '../src/editable.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'initial';
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(el: HTMLElement, eventName: string): Promise<CustomEvent> {
    return new Promise((resolve) => {
        el.addEventListener(eventName, (e) => resolve(e as CustomEvent), { once: true });
    });
}

describe('custom lifecycle events — dispatched on the trigger element', () => {
    it('"init" fires synchronously during construction, carrying the instance', () => {
        const el = mountTrigger();
        let received: Editable | undefined;
        el.addEventListener('init', (e) => {
            received = (e as CustomEvent).detail.Editable;
        });

        const inst = new Editable(el, { type: 'text' });

        expect(received).toBe(inst);
    });

    it('popup: "show" then "shown" fire in order when opening', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        const order: string[] = [];
        el.addEventListener('show', () => order.push('show'));
        el.addEventListener('shown', () => order.push('shown'));

        el.click();
        await sleep(50);

        expect(order).toEqual(['show', 'shown']);
    });

    it('popup: "hide" then "hidden" fire in order when closing', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });
        el.click();
        await sleep(50);

        const order: string[] = [];
        el.addEventListener('hide', () => order.push('hide'));
        el.addEventListener('hidden', () => order.push('hidden'));

        document.querySelector<HTMLButtonElement>('.popover button.btn-danger')?.click();
        await sleep(200);

        expect(order).toEqual(['hide', 'hidden']);
    });

    it('inline: "show" then "shown" fire in order when opening', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline' });

        const order: string[] = [];
        el.addEventListener('show', () => order.push('show'));
        el.addEventListener('shown', () => order.push('shown'));

        el.click();
        await sleep(50);

        expect(order).toEqual(['show', 'shown']);
    });

    it('inline: "hide" then "hidden" fire in order when closing', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline' });
        el.click();
        await sleep(50);

        const order: string[] = [];
        el.addEventListener('hide', () => order.push('hide'));
        el.addEventListener('hidden', () => order.push('hidden'));

        el.querySelector<HTMLButtonElement>('.btn-danger')?.click();
        await sleep(200);

        expect(order).toEqual(['hide', 'hidden']);
    });

    it('"save" fires after a local-only submit (no url configured)', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });
        el.click();
        await sleep(50);

        const savePromise = waitFor(el, 'save');
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'changed';
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();

        const event = await savePromise;
        expect(event.detail.Editable).toBeInstanceOf(Editable);
    });
});
