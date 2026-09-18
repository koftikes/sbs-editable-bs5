import type Editable from '../editable.ts';

export default class BaseMode {
    context: Editable;

    constructor(context: Editable) {
        if (this.constructor === BaseMode) {
            throw new Error(
                'BaseMode is abstract and cannot be instantiated directly — create a subclass that implements init()/enable()/disable()/hide()/destroy() (see PopupMode, InlineMode).',
            );
        }
        this.context = context;
    }

    event_show() {
        this.context.typeElement.hideError();
        if (!this.context.typeElement.element) {
            throw new Error(
                `${this.context.typeElement.constructor.name}.create() did not call createContainer() — the input element was never set.`,
            );
        }
        this.context.typeElement.element.value = this.context.getValue();
        this.context.element.dispatchEvent(new CustomEvent('show', { detail: { Editable: this.context } }));
    }

    event_shown() {
        this.context.element.dispatchEvent(new CustomEvent('shown', { detail: { Editable: this.context } }));
    }

    event_hide() {
        this.context.element.dispatchEvent(new CustomEvent('hide', { detail: { Editable: this.context } }));
    }

    event_hidden() {
        this.context.element.dispatchEvent(new CustomEvent('hidden', { detail: { Editable: this.context } }));
    }

    init() {
        throw new Error(`${this.constructor.name} must implement init().`);
    }

    enable() {
        throw new Error(`${this.constructor.name} must implement enable().`);
    }

    disable() {
        throw new Error(`${this.constructor.name} must implement disable().`);
    }

    hide() {
        throw new Error(`${this.constructor.name} must implement hide().`);
    }

    destroy() {
        throw new Error(`${this.constructor.name} must implement destroy().`);
    }
}
