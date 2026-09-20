import { afterEach, describe, expect, it } from 'vitest';
import Editable from '../src/editable.ts';

afterEach(() => {
    document.body.innerHTML = '';
});

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'initial';
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Escape cancels an open edit', () => {
    it('popup: Escape closes the popover and discards the change', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', value: 'original' });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'discarded';
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(200);

        expect(document.querySelectorAll('.popover').length).toBe(0);
        expect(el.textContent).toBe('original');
    });

    it('inline: Escape closes the input and discards the change', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline', value: 'original' });

        el.click();
        await sleep(50);
        const input = el.querySelector<HTMLInputElement>('input[type="text"]');
        if (input) input.value = 'discarded';
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(200);

        expect(el.querySelector('input')).toBeNull();
        expect(el.textContent).toBe('original');
    });

    it('returns focus to the trigger after Escape', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(200);

        expect(document.activeElement).toBe(el);
    });
});

describe('the generated control gets an accessible name from title', () => {
    it('popup: sets aria-label on the input from options.title', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', title: 'Edit username' });

        el.click();
        await sleep(50);

        expect(document.querySelector('.popover input[type="text"]')?.getAttribute('aria-label')).toBe('Edit username');
    });

    it('inline: sets aria-label too, even though there is no visible title anywhere', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline', title: 'Edit username' });

        el.click();
        await sleep(50);

        expect(el.querySelector('input')?.getAttribute('aria-label')).toBe('Edit username');
    });

    it('does not set aria-label when title is empty', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);

        expect(document.querySelector('.popover input[type="text"]')?.hasAttribute('aria-label')).toBe(false);
    });

    it('an explicit attributes["aria-label"] overrides the one derived from title', async () => {
        const el = mountTrigger();
        new Editable(el, {
            type: 'text',
            title: 'Edit username',
            attributes: { 'aria-label': 'Custom label' },
        });

        el.click();
        await sleep(50);

        expect(document.querySelector('.popover input[type="text"]')?.getAttribute('aria-label')).toBe('Custom label');
    });
});

describe('the error region announces to assistive technology', () => {
    it('carries role="alert"', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);
        expect(document.querySelector('.popover .editable-error')?.getAttribute('role')).toBe('alert');
    });
});

describe('focus returns to the trigger after cancel / successful save', () => {
    it('cancel button returns focus to the trigger', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);
        document.querySelector<HTMLButtonElement>('.popover button.btn-danger')?.click();
        await sleep(200);

        expect(document.activeElement).toBe(el);
    });

    it('a successful local save returns focus to the trigger', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.click();
        await sleep(50);
        const input = document.querySelector<HTMLInputElement>('.popover input[type="text"]');
        if (input) input.value = 'saved';
        document.querySelector<HTMLButtonElement>('.popover button.btn-success')?.click();
        await sleep(200);

        expect(document.activeElement).toBe(el);
    });
});

describe('trigger is keyboard-accessible when it has no native semantics', () => {
    it('an <a> without href gets tabindex="0" and role="button"', () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        expect(el.getAttribute('tabindex')).toBe('0');
        expect(el.getAttribute('role')).toBe('button');
    });

    it('Enter opens the widget', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('Space opens the widget', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text' });

        el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        await sleep(50);

        expect(document.querySelectorAll('.popover').length).toBe(1);
    });

    it('does not touch tabindex/role on an element that already has them', () => {
        const el = document.createElement('span');
        el.setAttribute('tabindex', '-1');
        el.setAttribute('role', 'presentation');
        document.body.append(el);

        new Editable(el, { type: 'text' });

        expect(el.getAttribute('tabindex')).toBe('-1');
        expect(el.getAttribute('role')).toBe('presentation');
    });

    it('does not intercept typing inside an open inline-mode input', async () => {
        const el = mountTrigger();
        new Editable(el, { type: 'text', mode: 'inline', value: '' });

        el.click();
        await sleep(50);
        const input = el.querySelector<HTMLInputElement>('input[type="text"]');
        if (!input) throw new Error('input not found');
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        await sleep(50);

        // the widget must still be open — a false "reopen" would have replaced the input
        expect(el.querySelector('input')).toBe(input);
    });

    it('a real <button> trigger is left alone (already natively interactive)', () => {
        const el = document.createElement('button');
        el.textContent = 'edit';
        document.body.append(el);

        new Editable(el, { type: 'text' });

        expect(el.hasAttribute('tabindex')).toBe(false);
        expect(el.hasAttribute('role')).toBe(false);
    });
});
