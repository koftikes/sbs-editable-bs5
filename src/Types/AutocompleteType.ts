import type { SelectSourceItem } from '../Interfaces/Options.ts';
import { flattenSourceData } from './ListSource.js';
import ListType from './ListType.js';

function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

// Unique per instance so aria-controls/aria-activedescendant can reference a real id even with
// several autocomplete fields open on the same page.
let instanceCounter = 0;

export default class AutocompleteType extends ListType {
    private menu: HTMLDivElement | null = null;
    private matches: SelectSourceItem[] = [];
    private activeIndex = -1;
    // Mirrors x-editable's typeahead $input.data('value') — the last item explicitly picked
    // via click or arrow+Enter. Re-validated against the current text before being trusted.
    private selected: SelectSourceItem | null = null;

    create() {
        const input = this.createElement('input');
        input.type = 'text';
        input.autocomplete = 'off';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
        input.setAttribute('aria-expanded', 'false');

        const container = this.createContainer(input);

        this.menu = document.createElement('div');
        this.menu.className = 'dropdown-menu';
        this.menu.id = `editable-autocomplete-${++instanceCounter}`;
        this.menu.setAttribute('role', 'listbox');
        input.setAttribute('aria-controls', this.menu.id);
        input.insertAdjacentElement('afterend', this.menu);

        input.addEventListener('input', () => this.filterAndRender(input.value));
        input.addEventListener('focus', () => this.filterAndRender(input.value));
        input.addEventListener('blur', () => this.closeMenu());

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen()) {
                // Close suggestions first; let a second Escape close the editor itself.
                e.stopPropagation();
                this.closeMenu();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveActive(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveActive(-1);
            } else if (e.key === 'Enter' && this.activeIndex >= 0) {
                e.preventDefault();
                e.stopPropagation();
                this.selectItem(this.matches[this.activeIndex]);
            }
        });

        this.loadSource();
        return container;
    }

    // x-editable's input2value, extended: a selection made via click/arrow+Enter is trusted
    // first; failing that, an exact (case-insensitive) text match against the source also
    // counts — so typing the correct label out by hand works without having to click it.
    // Anything else is either free text (allowCustomValue) or rejected back to the pre-edit
    // value (the submit handler no-ops when nothing actually changed).
    getValue(): string {
        if (!this.element) return '';
        const typed = this.element.value;

        if (this.selected && this.selected.text.toLowerCase() === typed.toLowerCase()) {
            return String(this.selected.value);
        }

        const exact = flattenSourceData(this.sourceData).find(
            (item) => item.text.toLowerCase() === typed.toLowerCase(),
        );
        if (exact) return String(exact.value);

        if (this.context.options.allowCustomValue) return typed;
        return this.context.getValue();
    }

    applyValueToElement(): void {
        if (!this.element) return;
        const value = this.context.getValue();
        const match = flattenSourceData(this.sourceData).find((item) => String(item.value) === value);
        this.selected = match ?? null;
        this.element.value = match ? match.text : this.context.options.allowCustomValue ? value : '';
    }

    initText(): boolean {
        const value = this.context.getValue();
        if (value === '') {
            this.context.element.textContent = this.context.options.emptyText || '';
            return true;
        }
        const match = flattenSourceData(this.sourceData).find((item) => String(item.value) === value);
        if (!match && !this.context.options.allowCustomValue) {
            this.context.element.textContent = this.context.options.emptyText || '';
            return true;
        }
        const text = match ? match.text : value;
        this.context.element.textContent = this.context.options.render
            ? this.context.options.render(text, this.context)
            : text;
        return false;
    }

    protected renderList(): void {
        this.filterAndRender(this.element?.value ?? '');
    }

    private filterAndRender(query: string): void {
        if (!this.menu) return;
        const threshold = (this.context.options.threshold as number) ?? 2;
        if (query.length < threshold) {
            this.closeMenu();
            return;
        }

        const maxItems = this.context.options.maxItems as number | undefined;
        const normalizedQuery = normalize(query);
        const all = flattenSourceData(this.sourceData).filter((item) => normalize(item.text).includes(normalizedQuery));
        this.matches = maxItems !== undefined && maxItems > 0 ? all.slice(0, maxItems) : all;
        this.activeIndex = -1;

        this.menu.replaceChildren(...this.matches.map((item, index) => this.buildMenuItem(item, query, index)));
        const isOpen = this.matches.length > 0;
        this.menu.classList.toggle('show', isOpen);
        this.element?.setAttribute('aria-expanded', String(isOpen));
    }

    private buildMenuItem(item: SelectSourceItem, query: string, index: number): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dropdown-item';
        button.id = `${this.menu?.id}-option-${index}`;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');
        button.dataset.index = String(index);

        const idx = normalize(item.text).indexOf(normalize(query));
        if (idx >= 0) {
            const mark = document.createElement('mark');
            mark.textContent = item.text.slice(idx, idx + query.length);
            button.append(item.text.slice(0, idx), mark, item.text.slice(idx + query.length));
        } else {
            button.textContent = item.text;
        }

        button.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus on the input
        button.addEventListener('click', () => this.selectItem(item));
        return button;
    }

    private selectItem(item: SelectSourceItem): void {
        this.selected = item;
        if (this.element) this.element.value = item.text;
        this.closeMenu();
        if (!this.context.options.showButtons && this.form) {
            this.form.dispatchEvent(new Event('submit'));
        }
    }

    private moveActive(delta: number): void {
        if (!this.matches.length) return;
        this.activeIndex = (this.activeIndex + delta + this.matches.length) % this.matches.length;
        const items = this.menu?.querySelectorAll<HTMLButtonElement>('.dropdown-item') ?? [];
        items.forEach((el, i) => {
            const active = i === this.activeIndex;
            el.classList.toggle('active', active);
            el.setAttribute('aria-selected', String(active));
        });
        const activeItem = items[this.activeIndex];
        if (activeItem) this.element?.setAttribute('aria-activedescendant', activeItem.id);
        activeItem?.scrollIntoView({ block: 'nearest' });
    }

    private isMenuOpen(): boolean {
        return this.menu?.classList.contains('show') ?? false;
    }

    private closeMenu(): void {
        this.menu?.classList.remove('show');
        this.activeIndex = -1;
        this.element?.setAttribute('aria-expanded', 'false');
        this.element?.removeAttribute('aria-activedescendant');
    }
}
