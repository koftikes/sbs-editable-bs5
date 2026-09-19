import type Editable from '../editable.ts';
import type {
    SelectSourceData,
    SelectSourceGroup,
    SelectSourceItem,
    SelectSourceValue,
} from '../Interfaces/Options.ts';

function isGroup(item: SelectSourceItem | SelectSourceGroup): item is SelectSourceGroup {
    return 'children' in item;
}

// Accepts every shape `source` can arrive in — a typed array, a plain {value: text} map, or a
// flat list of strings/numbers — and normalizes it to SelectSourceData. `children` arrays
// (optgroups) are normalized recursively.
export function normalizeSourceData(data: unknown): SelectSourceData {
    if (Array.isArray(data)) {
        return data.map((item): SelectSourceItem | SelectSourceGroup => {
            if (item !== null && typeof item === 'object') {
                if ('children' in item && Array.isArray((item as SelectSourceGroup).children)) {
                    const group = item as SelectSourceGroup;
                    return { text: group.text, children: normalizeSourceData(group.children) as SelectSourceItem[] };
                }
                return item as SelectSourceItem;
            }
            return { value: item as string | number, text: String(item) };
        });
    }
    if (data !== null && typeof data === 'object') {
        return Object.entries(data as Record<string, string>).map(([value, text]) => ({ value, text }));
    }
    return [];
}

// Shared across every SelectType instance on the page, keyed by URL — avoids N identical
// requests for N editable cells in a grid that all share the same `source`.
const requestCache = new Map<string, Promise<SelectSourceData>>();

async function fetchSourceData(url: string, useCache: boolean): Promise<SelectSourceData> {
    if (useCache && requestCache.has(url)) {
        return requestCache.get(url) as Promise<SelectSourceData>;
    }
    const promise = fetch(url, { method: 'GET' }).then(async (response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        return normalizeSourceData(await response.json());
    });
    if (useCache) {
        requestCache.set(url, promise);
        promise.catch(() => requestCache.delete(url));
    }
    return promise;
}

// Resolves `source`, calling a function-valued source exactly once regardless of whether it
// returns data directly or a Promise. Returns the data synchronously when no I/O is needed (a
// literal array/object, or a function returning one synchronously) — so the label renders in
// the same tick create() runs — or a Promise the caller must await (an ajax URL, or a function
// returning a Promise).
export function resolveSource(context: Editable): SelectSourceData | Promise<SelectSourceData> {
    const source = context.options.source as SelectSourceValue | undefined;
    if (typeof source === 'string') {
        const useCache = context.options.sourceCache !== false;
        return fetchSourceData(source, useCache);
    }
    if (typeof source === 'function') {
        const result = source(context);
        return result instanceof Promise ? result.then(normalizeSourceData) : normalizeSourceData(result);
    }
    return normalizeSourceData(source);
}

export function flattenSourceData(data: SelectSourceData): SelectSourceItem[] {
    const result: SelectSourceItem[] = [];
    for (const item of data) {
        if (isGroup(item)) result.push(...item.children);
        else result.push(item);
    }
    return result;
}
