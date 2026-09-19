import type Editable from '../editable.ts';
import type BaseTypeButtons from '../Interfaces/BaseTypeButtons.ts';

export default class BaseType {
    context: Editable;
    element: HTMLInputElement | null = null;
    error: HTMLElement | null = null;
    form: HTMLElement | null = null;
    load: HTMLElement | null = null;
    buttons: BaseTypeButtons = { success: null, cancel: null };

    constructor(context: Editable) {
        if (this.constructor === BaseType) {
            throw new Error(
                'BaseType is abstract and cannot be instantiated directly — create a subclass that implements create() (see InputType, SelectType, etc.).',
            );
        }
        this.context = context;
    }

    create(): HTMLElement {
        throw new Error(`${this.constructor.name} must implement create().`);
    }

    // Flags options that only make sense for a different type (e.g. `format` on a `text` field) —
    // they're silently ignored otherwise, which is easy to miss. Override per-type as needed.
    checkUnsupportedOptions(): void {
        if (this.context.options.format !== undefined) {
            console.error(
                `${this.constructor.name} does not support the "format" option — it only applies to type: 'date'/'datetime'. It will be ignored.`,
            );
        }
        if (this.context.options.displayFormat !== undefined) {
            console.error(
                `${this.constructor.name} does not support the "displayFormat" option — it only applies to type: 'date'/'datetime'. It will be ignored.`,
            );
        }
        if (this.context.options.source !== undefined) {
            console.error(
                `${this.constructor.name} does not support the "source" option — it only applies to type: 'select'. It will be ignored.`,
            );
        }
        if (this.context.options.sourceCache !== undefined) {
            console.error(
                `${this.constructor.name} does not support the "sourceCache" option — it only applies to type: 'select'. It will be ignored.`,
            );
        }
    }

    createContainer(element: HTMLInputElement): HTMLDivElement {
        const div = document.createElement(`div`);
        this.element = element;
        this.error = this.createContainerError();
        this.form = this.createContainerForm();
        this.load = this.createContainerLoad();
        this.form.append(element, this.load);
        this.buttons.success = null;
        this.buttons.cancel = null;
        if (this.context.options.showButtons) {
            this.buttons.success = this.createButtonSuccess();
            this.buttons.cancel = this.createButtonCancel();
            this.form.append(this.buttons.success, this.buttons.cancel);
        }

        div.append(this.error, this.form);
        return div;
    }

    createContainerError(): HTMLDivElement {
        const div = document.createElement(`div`);
        div.classList.add('editable-error', 'text-danger', 'fst-italic', 'mb-2', 'fw-bold');
        div.setAttribute('role', 'alert');
        div.hidden = true;
        return div;
    }

    // Closes the widget and returns keyboard focus to the trigger — used for every
    // explicit exit (cancel, Escape, successful save), but not for an outside-click
    // dismissal, where focus should stay wherever the user actually clicked.
    private closeAndFocus(): void {
        this.context.modeElement.hide();
        this.context.element.focus();
    }

    createContainerForm(): HTMLFormElement {
        const form = document.createElement(`form`);
        form.classList.add('editable-form', 'd-flex', 'align-items-start');
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeAndFocus();
            }
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newValue = this.getValue();
            if (this.context.options.send && this.context.options.url && this.context.getValue() !== newValue) {
                this.showLoad();
                let msg: string | undefined;
                try {
                    const response = await this.ajax(newValue);
                    if (response.ok) {
                        msg = await this.context.success(response, newValue);
                    } else {
                        msg =
                            (await this.context.error(response, newValue)) ||
                            `${response.status} ${response.statusText}`;
                    }
                } catch (error) {
                    console.error(error);
                    if (!(error instanceof TypeError)) {
                        throw error;
                    }
                    msg = error.message;
                }

                if (msg) {
                    this.showError();
                    this.setError(msg);
                } else {
                    this.setError('');
                    this.hideError();
                    this.context.setValue(this.getValue());
                    this.closeAndFocus();
                    this.initText();
                }
                this.hideLoad();
            } else {
                this.context.setValue(this.getValue());
                this.closeAndFocus();
                this.initText();
            }
            this.context.element.dispatchEvent(new CustomEvent('save', { detail: { Editable: this.context } }));
        });
        return form;
    }

    createContainerLoad(): HTMLDivElement {
        const div = document.createElement(`div`);
        div.classList.add('editable-load-overlay');
        div.hidden = true;
        const loader = document.createElement(`div`);
        loader.classList.add('editable-loader');
        div.append(loader);
        return div;
    }

    createButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('btn', 'btn-sm');
        return button;
    }

    createButtonSuccess(): HTMLButtonElement {
        const btn_success = this.createButton();
        btn_success.type = 'submit';
        btn_success.classList.add('btn-success');
        btn_success.setAttribute('aria-label', 'Save');
        btn_success.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.485 1.929a1 1 0 0 1 .057 1.414l-7.5 8a1 1 0 0 1-1.45.036l-3.5-3.5a1 1 0 1 1 1.414-1.415L5.5 9.379l6.571-7.007a1 1 0 0 1 1.414-.043z"/></svg>`;
        return btn_success;
    }

    createButtonCancel(): HTMLButtonElement {
        const btn_cancel = this.createButton();
        btn_cancel.classList.add('btn-danger');
        btn_cancel.setAttribute('aria-label', 'Cancel');
        btn_cancel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>`;
        btn_cancel.addEventListener('click', () => {
            this.closeAndFocus();
        });
        return btn_cancel;
    }

    hideLoad(): void {
        if (this.load) {
            this.load.hidden = true;
        }
    }

    showLoad(): void {
        if (this.load) {
            this.load.hidden = false;
        }
    }

    async ajax(new_value: string): Promise<Response> {
        const urlOption = this.context.options.url;
        if (!urlOption) {
            const err = new Error(
                'ajax() was called without a `url` option configured. Set `url` (string or function) before calling save.',
            );
            console.error(err);
            throw err;
        }
        const url = typeof urlOption === 'function' ? urlOption(this.context, new_value) : urlOption;

        if (this.context.options.requestBuilder) {
            const built = await this.context.options.requestBuilder(this.context, new_value, url);
            return fetch(built.url, built.init);
        }

        const form = new FormData();
        form.append(this.context.options.name ?? 'value', new_value);

        const ajaxOptions = { ...this.context.options.ajaxOptions };
        ajaxOptions.body = form;
        return fetch(url, ajaxOptions);
    }

    async successResponse(_response: Response, _newValue: string): Promise<string | undefined> {
        return undefined;
    }

    async errorResponse(_response: Response, _newValue: string): Promise<string | undefined> {
        return undefined;
    }

    setError(errorMsg: string): void {
        if (this.error) {
            this.error.textContent = errorMsg;
        }
    }

    showError(): void {
        if (this.error) {
            this.error.hidden = false;
        }
    }

    hideError(): void {
        if (this.error) {
            this.error.hidden = true;
        }
    }

    createElement(name: string): HTMLInputElement {
        const element = <HTMLInputElement>document.createElement(name);
        element.classList.add('form-control');
        if (this.context.options.required) {
            element.required = this.context.options.required;
        }
        this.applyAttributes(element);
        if (!this.context.options.showButtons) {
            element.addEventListener('change', () => {
                if (this.form) {
                    this.form.dispatchEvent(new Event('submit'));
                }
            });
        }
        this.add_focus(element);
        return element;
    }

    private applyAttributes(element: HTMLInputElement): void {
        const attrs = this.context.options.attributes || {};
        const allowedAttributes = [
            'step',
            'min',
            'max',
            'minlength',
            'maxlength',
            'pattern',
            'placeholder',
            'required',
            'readonly',
            'disabled',
            'autocomplete',
            'autofocus',
        ];
        for (const [key, value] of Object.entries(attrs)) {
            if (allowedAttributes.includes(key) && value !== undefined) {
                element.setAttribute(key, String(value));
            }
        }
    }

    add_focus(element: HTMLInputElement): void {
        this.context.element.addEventListener(
            'shown',
            () => {
                element.focus();
            },
            { once: true },
        );
    }

    initText(): boolean {
        if (this.context.getValue() === '') {
            this.context.element.textContent = this.context.options.emptyText || '';
            return true;
        } else {
            const text = this.context.getValue();
            this.context.element.textContent = this.context.options.render
                ? this.context.options.render(text, this.context)
                : text;
            return false;
        }
    }

    // Called every time the editor is shown (BaseMode.event_show()), right after any stale
    // save error is cleared. No-op by default; ListType uses it to retry a source that failed
    // to load — unlike a save error, that failure describes an ongoing problem, not a one-off
    // attempt worth silently hiding on the next open.
    onShow(): void {}

    initOptions(): void {}

    getValue(): string {
        return this.element ? this.element.value : '';
    }
}
