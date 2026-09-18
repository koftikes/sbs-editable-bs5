import { afterEach, describe, expect, it } from 'vitest';
import Editable from '../src/editable.ts';

afterEach(() => {
    document.body.innerHTML = '';
});

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('popup inherits a data-bs-theme scoped around the trigger, not the page default', () => {
    it('copies data-bs-theme from an ancestor wrapper onto the popover tip', async () => {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-bs-theme', 'dark');
        const el = document.createElement('a');
        el.textContent = 'x';
        wrapper.append(el);
        document.body.append(wrapper);

        new Editable(el, { type: 'text' });
        el.click();
        await sleep(50);

        const popover = document.querySelector('.popover');
        expect(popover?.getAttribute('data-bs-theme')).toBe('dark');
    });

    it('leaves the tip untouched when nothing around the trigger sets a theme', async () => {
        const el = document.createElement('a');
        el.textContent = 'x';
        document.body.append(el);

        new Editable(el, { type: 'text' });
        el.click();
        await sleep(50);

        const popover = document.querySelector('.popover');
        expect(popover?.hasAttribute('data-bs-theme')).toBe(false);
    });

    it('picks up data-bs-theme set directly on the trigger itself', async () => {
        const el = document.createElement('a');
        el.textContent = 'x';
        el.setAttribute('data-bs-theme', 'dark');
        document.body.append(el);

        new Editable(el, { type: 'text' });
        el.click();
        await sleep(50);

        const popover = document.querySelector('.popover');
        expect(popover?.getAttribute('data-bs-theme')).toBe('dark');
    });
});
