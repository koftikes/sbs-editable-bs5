import type { SelectSourceData, SelectSourceItem } from '../Interfaces/Options.ts';
import BaseType from './BaseType.js';
import { flattenSourceData, resolveSource } from './ListSource.js';

// Abstract base for inputs whose options come from `source` (array, object map, ajax URL, or a
// function) — mirrors x-editable's `list` input. Normalizes every source shape, resolves it
// (synchronously when possible — see ListSource.ts), and matches the current value against it.
export default abstract class ListType extends BaseType {
    sourceData: SelectSourceData = [];
    private loadFailed = false;

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
    }

    // Subclasses render their concrete control (a <select>'s <option>s, a checkbox group, ...).
    // Called once synchronously if the source resolves without I/O, once more when an
    // ajax/async source resolves.
    protected abstract renderList(data: SelectSourceData): void;

    protected loadSource(): void {
        const resolved = resolveSource(this.context);
        if (!(resolved instanceof Promise)) {
            this.sourceData = resolved;
            this.loadFailed = false;
            this.renderList(resolved);
            return;
        }
        this.showLoad();
        resolved
            .then((data) => {
                this.sourceData = data;
                this.loadFailed = false;
                this.renderList(data);
                // BaseMode.event_show() already set the control's value once, before this
                // resolved — against an empty control with nothing to match yet. Re-apply it
                // now that renderList() gave it something to match against.
                if (this.element) {
                    this.element.value = this.context.getValue();
                }
                this.hideLoad();
                // A value set before the source finished loading couldn't be matched yet —
                // re-render the (closed) trigger's label now that it can be. Skip this while
                // showing as an open inline editor: there, the trigger element IS the editor's
                // container (InlineMode inserts it via replaceChildren), so writing to its
                // textContent here would blow away the <select> we just built.
                if (!this.context.element.contains(this.element)) {
                    this.context.init_text();
                }
            })
            .catch((error) => {
                console.error(error);
                this.loadFailed = true;
                this.hideLoad();
                this.showError();
                this.setError(error instanceof Error ? error.message : String(error));
            });
    }

    // A source-load failure describes an ongoing problem (bad URL, server down), not a one-off
    // attempt — retry it on every reopen instead of leaving a stale error that event_show()'s
    // hideError() would otherwise silently hide for good.
    onShow(): void {
        if (this.loadFailed) {
            this.loadFailed = false;
            this.loadSource();
        }
    }

    initText(): boolean {
        const value = this.context.getValue();
        if (value === '') {
            this.context.element.textContent = this.context.options.emptyText || '';
            return true;
        }
        const match = flattenSourceData(this.sourceData).find((item: SelectSourceItem) => String(item.value) === value);
        if (!match) {
            this.context.element.textContent = this.context.options.emptyText || '';
            return true;
        }
        this.context.element.textContent = this.context.options.render
            ? this.context.options.render(match.text, this.context)
            : match.text;
        return false;
    }

    initOptions(): void {
        this.context.get_opt('source', []);
        this.context.get_opt_bool('sourceCache', true);

        const source = this.context.options.source;
        if (typeof source === 'string' && source !== '') {
            const trimmed = source.trim();
            // Only strings that look like JSON are parsed eagerly (and fail loudly if malformed,
            // same as before this change); anything else — e.g. "/api/statuses" — is left as-is
            // and treated as an ajax URL by ListSource.ts.
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                    this.context.options.source = JSON.parse(trimmed);
                } catch (e) {
                    const el = this.context.element;
                    const identifier = el.id ? `#${el.id}` : `<${el.tagName.toLowerCase()}>`;
                    throw new Error(
                        `Invalid JSON in "source" option/data-source attribute on ${identifier}: ${(e as Error).message}`,
                    );
                }
            }
        }
    }
}
