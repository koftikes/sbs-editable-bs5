import { describe, expect, it } from 'vitest';
import Editable from '../src/editable.ts';
import BaseMode from '../src/Modes/BaseMode.ts';
import BaseType from '../src/Types/BaseType.ts';

function mountTrigger(): HTMLAnchorElement {
    const el = document.createElement('a');
    el.textContent = 'initial';
    document.body.append(el);
    return el;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('getValue() / setValue() / getOption() — public instance API', () => {
    it('getValue() reflects the current value', () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text', value: 'foo' });

        expect(inst.getValue()).toBe('foo');
    });

    it('setValue() updates the value and re-renders the closed element', () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text', value: 'foo' });

        inst.setValue('bar');

        expect(inst.getValue()).toBe('bar');
        expect(el.textContent).toBe('bar');
    });

    it('getOption() reads a resolved option by name', () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text', title: 'My title' });

        expect(inst.getOption('title')).toBe('My title');
    });

    it('getOption() returns null for an option that was never set', () => {
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text' });

        expect(inst.getOption('doesNotExist')).toBeNull();
    });
});

describe('Editable.registerType() — extension point for custom types', () => {
    class MarkerType extends BaseType {
        create() {
            const input = this.createElement('input');
            input.classList.add('marker-type-input');
            return this.createContainer(input);
        }
    }

    it('a registered custom type is routed to and rendered', async () => {
        Editable.registerType('marker', MarkerType);
        const el = mountTrigger();
        new Editable(el, { type: 'marker' });

        el.click();
        await sleep(50);

        expect(document.querySelector('.popover .marker-type-input')).not.toBeNull();
    });
});

describe('Editable.registerMode() — extension point for custom modes', () => {
    class MarkerMode extends BaseMode {
        init() {
            this.context.element.dataset.markerModeInit = 'yes';
        }
        enable() {}
        disable() {}
        hide() {
            this.context.element.dataset.markerModeHidden = 'yes';
        }
        destroy() {}
    }

    it('a registered custom mode drives init()/hide() instead of the built-in modes', () => {
        Editable.registerMode('marker-mode', MarkerMode);
        const el = mountTrigger();
        const inst = new Editable(el, { type: 'text', mode: 'marker-mode' as 'popup' });

        expect(el.dataset.markerModeInit).toBe('yes');

        inst.modeElement.hide();

        expect(el.dataset.markerModeHidden).toBe('yes');
    });
});
