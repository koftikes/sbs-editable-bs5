import type { Popover } from 'bootstrap';
import type Editable from '../editable.ts';
import type BaseType from '../Types/BaseType.ts';

export interface SelectSourceItem {
    value: string | number;
    text: string;
    disabled?: boolean;
}

export interface SelectSourceGroup {
    text: string;
    children: SelectSourceItem[];
}

export type SelectSourceData = Array<SelectSourceItem | SelectSourceGroup>;
export type SelectSourceRaw =
    | Array<SelectSourceItem | SelectSourceGroup | string | number>
    | Record<string, string>
    | string;
export type SelectSourceValue = SelectSourceRaw | ((context: Editable) => SelectSourceRaw | Promise<SelectSourceRaw>);

export default interface Options {
    // Core — read by every type/mode, set on virtually every instance
    type?: BaseType | string;
    mode?: 'popup' | 'inline';
    value?: string;
    name?: string;
    title?: string;
    required?: boolean;

    // Display
    emptyText?: string;
    showButtons?: boolean;
    popoverOptions?: Popover.Options;
    render?: (text: string, context: Editable) => string;

    // Networking — server-side persistence
    url?: string | ((context: Editable, newValue: string) => string) | null;
    send?: boolean;
    ajaxOptions?: RequestInit;
    // Fully replaces the default POST+FormData request. See url/ajaxOptions for the common case.
    requestBuilder?: (
        context: Editable,
        newValue: string,
        resolvedUrl: string,
    ) => { url: string; init: RequestInit } | Promise<{ url: string; init: RequestInit }>;

    // Callbacks — react to a request's outcome
    success?: (response: Response, newValue: string | number) => Promise<string | undefined>;
    error?: (response: Response, newValue: string | number) => Promise<string | undefined>;

    // type: 'date' / 'datetime' only
    format?: string;
    displayFormat?: string;

    // type: 'select' / 'autocomplete' only
    source?: SelectSourceValue;
    sourceCache?: boolean;

    // type: 'autocomplete' only
    /** Minimum characters typed before suggestions appear. Default: 2. */
    threshold?: number;
    /** Max suggestions shown. Only takes effect when > 0 — unset or 0 means unlimited. */
    maxItems?: number;
    /** Accept typed text that matches nothing in `source`. Default: false (must match an entry). */
    allowCustomValue?: boolean;

    // Escape hatch — raw HTML attributes applied to the generated input
    attributes?: { [key: string]: string | number | boolean | undefined };
}
