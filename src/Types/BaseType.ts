import Editable from "../editable.ts";
import BaseTypeButtons from "../Interfaces/BaseTypeButtons.ts";

export default class BaseType{
    context: Editable;
    element: HTMLInputElement|null = null;
    error: HTMLElement|null = null;
    form: HTMLElement|null = null;
    load: HTMLElement|null  = null;
    buttons: BaseTypeButtons = {success: null, cancel: null};

    constructor(context: Editable) {
        if(this.constructor === BaseType){
            throw new Error(`It's abstract class`);
        }
        this.context = context;
    }

    create(): HTMLElement
    {
        throw new Error('Method `create` not define!');
    }

    createContainer(element: HTMLInputElement): HTMLDivElement
    {
        const div = document.createElement(`div`);
        this.element = element;
        this.error = this.createContainerError();
        this.form = this.createContainerForm();
        this.load = this.createContainerLoad();
        this.form.append(element, this.load);
        this.buttons.success = null;
        this.buttons.cancel = null;
        if(this.context.options.showButtons){
            this.buttons.success = this.createButtonSuccess();
            this.buttons.cancel = this.createButtonCancel();
            this.form.append(this.buttons.success, this.buttons.cancel);
        }

        div.append(this.error, this.form);
        return div;
    }

    createContainerError(): HTMLDivElement
    {
        const div = document.createElement(`div`);
        div.classList.add("editable-error", "text-danger", "fst-italic", "mb-2", "fw-bold");
        div.hidden = true;
        return div;
    }

    createContainerForm(): HTMLFormElement
    {
        const form = document.createElement(`form`);
        form.classList.add("editable-form", "d-flex", "align-items-start");
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const newValue = this.getValue();
            if(this.context.options.send && this.context.options.pk && this.context.options.url && (this.context.getValue() !== newValue)){
                this.showLoad();
                let msg;
                try {
                    const response = await this.ajax(newValue);
                    if(response.ok){
                        msg = await this.context.success(response, newValue);
                    } else {
                        msg = await this.context.error(response, newValue) || `${response.status} ${response.statusText}`;
                    }
                } catch (error) {
                    console.error(error);
                    msg = error;
                }

                if(msg){
                    this.setError(msg);
                    this.showError();
                } else {
                    this.setError('');
                    this.hideError();
                    this.context.setValue(this.getValue());
                    this.context.modeElement.hide();
                    this.initText();
                }
                this.hideLoad();
            } else {
                this.context.setValue(this.getValue());
                this.context.modeElement.hide();
                this.initText();
            }
            this.context.element.dispatchEvent(new CustomEvent("save", {detail: {Editable: this.context}}));
        })
        return form;
    }

    createContainerLoad(): HTMLDivElement
    {
        const div = document.createElement(`div`);
        div.classList.add("editable-load-overlay");
        div.hidden = true;
        const loader = document.createElement(`div`);
        loader.classList.add("editable-loader");
        div.append(loader);
        return div;
    }

    createButton(): HTMLButtonElement
    {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("btn", "btn-sm");
        return button;
    }

    createButtonSuccess(): HTMLButtonElement
    {
        const btn_success = this.createButton();
        btn_success.type = "submit";
        btn_success.classList.add("btn-success");
        btn_success.setAttribute("aria-label", "Save");
        btn_success.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.485 1.929a1 1 0 0 1 .057 1.414l-7.5 8a1 1 0 0 1-1.45.036l-3.5-3.5a1 1 0 1 1 1.414-1.415L5.5 9.379l6.571-7.007a1 1 0 0 1 1.414-.043z"/></svg>`;
        return btn_success;
    }

    createButtonCancel(): HTMLButtonElement
    {
        const btn_cancel = this.createButton();
        btn_cancel.classList.add("btn-danger");
        btn_cancel.setAttribute("aria-label", "Cancel");
        btn_cancel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>`;
        btn_cancel.addEventListener("click", () => {
            this.context.modeElement.hide();
        });
        return btn_cancel;
    }

    hideLoad(): void
    {
        if(this.load){
            this.load.hidden = true;
        }
    }

    showLoad(): void
    {
        if(this.load){
            this.load.hidden = false;
        }
    }

    ajax(new_value: string): Promise<Response>
    {
        let url = this.context.options.url;
        if(!url){
            throw new Error("URL is required!");
        }
        if(!this.context.options.pk){
            throw new Error("pk is required!");
        }
        if(!this.context.options.name){
            throw new Error("Name is required!");
        }
        const form = new FormData;
        form.append("pk", this.context.options.pk);
        form.append("name", this.context.options.name);
        form.append("value", new_value);
        if(this.context.options.ajaxOptions?.method === "GET"){
            const params: [string?] = [];
            form.forEach((value, key) => {
                params.push(`${key}=${value}`);
            });
            url += "?" + params.join("&");
        }

        const ajaxOptions = {...this.context.options.ajaxOptions};
        ajaxOptions.body = form;
        return fetch(url, ajaxOptions);
    }

    async successResponse(_response: Response, _newValue: string): Promise<any>
    {

    }

    async errorResponse(_response: Response, _newValue: string): Promise<any>
    {

    }

    setError(errorMsg: string): void
    {
        if(this.error){
            this.error.textContent = errorMsg;
        }
    }

    showError(): void
    {
        if(this.error){
            this.error.hidden = false;
        }
    }

    hideError(): void
    {
        if(this.error){
            this.error.hidden = true;
        }
    }

    createElement(name: string): HTMLInputElement
    {
        const element = <HTMLInputElement>document.createElement(name);
        element.classList.add("form-control");
        if(this.context.options.required){
            element.required = this.context.options.required;
        }
        if(!this.context.options.showButtons){
            element.addEventListener('change', () => {
                if(this.form){
                    this.form.dispatchEvent(new Event('submit'));
                }
            });
        }
        this.add_focus(element);
        return element;
    }

    add_focus(element: HTMLInputElement): void
    {
        this.context.element.addEventListener('shown', function(){
            element.focus();
        }, { once: true });
    }

    initText(): boolean
    {
        if(this.context.getValue() === ""){
            this.context.element.textContent = this.context.options.emptyText || "";
            return true;
        } else {
            this.context.element.textContent = this.context.getValue();
            return false;
        }
    }

    initOptions(): void
    {

    }

    getValue(): string
    {
        return this.element ? this.element.value : '';
    }
}
