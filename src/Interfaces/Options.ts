import type { Popover } from 'bootstrap';
import type Editable from '../editable.ts';
import type BaseType from '../Types/BaseType.ts';

export default interface Options {
    value?: string;
    name?: string;
    title?: string;
    type?: BaseType | string;
    ajaxOptions?: RequestInit;
    disabled?: boolean;
    send?: boolean;
    mode?: 'popup' | 'inline';
    emptyText?: string;
    url?: string | ((context: Editable, newValue: string) => string) | null;
    requestBuilder?: (
        context: Editable,
        newValue: string,
        resolvedUrl: string,
    ) => { url: string; init: RequestInit } | Promise<{ url: string; init: RequestInit }>;
    required?: boolean;
    showButtons?: boolean;
    success?: (response: Response, newValue: string | number) => Promise<string | undefined>;
    error?: (response: Response, newValue: string | number) => Promise<string | undefined>;
    popoverOptions?: Popover.Options;
    format?: string;
    displayFormat?: string;
    source?: [{ value: string | number; text: string }] | string;
    attributes?: { [key: string]: string | number | boolean | undefined };
}
