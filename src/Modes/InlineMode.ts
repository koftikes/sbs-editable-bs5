import BaseMode from './BaseMode.js';

export default class InlineMode extends BaseMode {
    private openHandler: (() => void) | null = null;

    init() {
        this.openHandler = () => {
            if (!this.context.options.disabled) {
                const item = this.context.typeElement.create();
                this.event_show();
                this.removeOpenHandler();
                this.context.element.replaceChildren(item);
                this.event_shown();
            }
        };
        this.context.element.addEventListener('click', this.openHandler);
    }

    private removeOpenHandler(): void {
        if (this.openHandler) {
            this.context.element.removeEventListener('click', this.openHandler);
            this.openHandler = null;
        }
    }

    enable() {}

    disable() {}

    hide() {
        this.event_hide();
        this.context.element.textContent = this.context.getValue();
        setTimeout(() => {
            this.init();
            this.event_hidden();
        }, 100);
    }

    destroy(): void {
        this.removeOpenHandler();
    }
}
