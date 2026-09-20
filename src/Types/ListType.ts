import type { SelectSourceData, SelectSourceItem } from '../Interfaces/Options.ts';
import BaseType from './BaseType.js';
import { flattenSourceData, resolveSource } from './ListSource.js';

// Abstract base for inputs whose options come from `source` (array, object map, ajax URL, or a
// function) — mirrors x-editable's `list` input. Normalizes every source shape, resolves it
// (synchronously when possible — see ListSource.ts), and matches the current value against it.
export default abstract class ListType extends BaseType {
    sourceData: SelectSourceData = [];
    private loadFailed = false;
    private pending: Promise<SelectSourceData> | null = null;

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

    // Subclasses render their concrete control (a <select>'s <option>s, a checkbox group, ...)
    // from the currently-known source data.
    protected abstract renderList(data: SelectSourceData): void;

    // Reflects whatever is currently known about the source into the just-built control. Safe
    // whenever create() runs — eagerly at construction (popup) or lazily on first open (inline)
    // — since resolve() (see initOptions()) already started resolving independently of either,
    // so by the time create() runs the answer may already be in, still pending, or (on a later
    // inline open) previously failed.
    protected loadSource(): void {
        if (this.pending) {
            this.showLoad();
            return;
        }
        if (this.loadFailed) {
            // onShow() runs immediately after this (event_show(), for both modes) and retries —
            // nothing to render here.
            return;
        }
        this.renderList(this.sourceData);
    }

    // Starts (or retries) resolving `source`, independently of whether a control has been built
    // yet — this is what makes the closed trigger's label correct even in inline mode, where
    // create() doesn't run until the first open. DOM updates (render/loader/error) only happen
    // here if a control already exists; otherwise this just updates sourceData/loadFailed and
    // refreshes the closed label via context.init_text().
    private resolve(): void {
        const resolved = resolveSource(this.context);
        if (!(resolved instanceof Promise)) {
            this.sourceData = resolved;
            this.loadFailed = false;
            return;
        }

        this.pending = resolved;
        if (this.element) this.showLoad();

        resolved
            .then((data) => {
                if (this.pending !== resolved) return; // superseded by a later resolve()
                this.pending = null;
                this.sourceData = data;
                this.loadFailed = false;
                if (this.element) {
                    this.renderList(data);
                    this.applyValueToElement();
                    this.hideLoad();
                }
                // Refresh the closed trigger's label — unless that would blow away an open
                // inline editor (there, context.element IS the editor's own container).
                if (!this.element || !this.context.element.contains(this.element)) {
                    this.context.init_text();
                }
            })
            .catch((error) => {
                if (this.pending !== resolved) return;
                this.pending = null;
                console.error(error);
                this.loadFailed = true;
                if (this.element) {
                    this.hideLoad();
                    this.showError();
                    this.setError(error instanceof Error ? error.message : String(error));
                }
            });
    }

    // A source-load failure describes an ongoing problem (bad URL, server down), not a one-off
    // attempt — retry it on every reopen instead of leaving a stale error that event_show()'s
    // hideError() would otherwise silently hide for good.
    onShow(): void {
        if (this.loadFailed) {
            this.loadFailed = false;
            this.resolve();
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

        // Resolve as early as possible — independent of create()/mode — so the closed trigger's
        // label is correct immediately for a synchronous source, and updates itself once an
        // async source resolves even if the editor is never opened (inline defers create() until
        // first open; this doesn't).
        this.resolve();
    }
}
