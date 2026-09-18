import { Popover } from 'bootstrap';
import BaseMode from './BaseMode.js';

export default class PopupMode extends BaseMode {
    popover: Popover | null = null;
    private abortController: AbortController = new AbortController();

    init() {
        const options = {
            container: 'body',
            content: this.context.typeElement.create(),
            html: true,
            customClass: 'editable',
            title: this.context.options.title,
        };
        this.popover = new Popover(this.context.element, Object.assign(options, this.context.options.popoverOptions));
        const { signal } = this.abortController;
        this.context.element.addEventListener(
            'show.bs.popover',
            () => {
                this.event_show();
            },
            { signal },
        );
        this.context.element.addEventListener(
            'shown.bs.popover',
            () => {
                this.event_shown();
            },
            { signal },
        );
        this.context.element.addEventListener(
            'hide.bs.popover',
            () => {
                this.event_hide();
            },
            { signal },
        );
        this.context.element.addEventListener(
            'hidden.bs.popover',
            () => {
                this.event_hidden();
            },
            { signal },
        );

        document.addEventListener(
            'click',
            (e) => {
                const target = <HTMLElement>e.target;
                // @ts-expect-error — Popover.tip is an undocumented internal property
                const tip = this.popover?.tip;
                if ((this.popover && target === tip) || target === this.context.element) return;
                let current = target.parentNode;
                while (current) {
                    if (current === tip) return;
                    current = current.parentNode;
                }
                this.hide();
            },
            { signal },
        );
    }

    enable(): void {
        if (this.popover) {
            this.popover.enable();
        }
    }

    disable(): void {
        if (this.popover) {
            this.popover.disable();
        }
    }

    hide(): void {
        if (this.popover) {
            this.popover.hide();
        }
    }

    destroy(): void {
        this.abortController.abort();
        this.popover?.dispose();
        this.popover = null;
    }
}
