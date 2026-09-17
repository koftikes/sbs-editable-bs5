import { Popover } from "bootstrap";
import BaseType from "../Types/BaseType.ts";

export default interface Options {
    value?: string;
    name?: string;
    pk?: string;
    title?: string;
    type?: BaseType|string;
    ajaxOptions?: RequestInit;
    disabled?: boolean;
    send?: boolean;
    mode?: 'popup'|'inline';
    emptyText?: string;
    url?: string|null;
    required?: boolean;
    showButtons?: boolean;
    success?: (response: Response, newValue: string|number) => Promise<any>;
    error?: (response: Response, newValue: string|number) => Promise<any>;
    popoverOptions?: Popover.Options
    //other
    format?: string;
    displayFormat?: string;
    source?: [{ value: string, text: string }] | string;
    attributes?: { [key: string]: string|number|boolean|undefined; };
}