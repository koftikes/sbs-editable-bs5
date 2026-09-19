import type { SelectSourceData, SelectSourceGroup, SelectSourceItem } from '../Interfaces/Options.ts';
import ListType from './ListType.js';

export default class SelectType extends ListType {
    create() {
        const select = this.createElement('select');
        const container = this.createContainer(select);
        this.loadSource();
        return container;
    }

    protected renderList(data: SelectSourceData): void {
        const select = this.element;
        if (!select) return;
        select.replaceChildren();

        // `attributes.placeholder` already works natively for input/textarea/date (it's a plain
        // HTML attribute) — <select> has no native placeholder, so here it renders as a disabled,
        // empty-valued first option instead. `disabled` only blocks picking it back via the UI —
        // it does NOT by itself block saving an empty value; pair it with `required` for that
        // (native constraint validation blocks the submit event before our handler runs).
        // Selected by default whenever the current value is '', since BaseMode.event_show() sets
        // `select.value = getValue()` on every open, and this option's value is exactly ''.
        const placeholder = this.context.options.attributes?.placeholder;
        if (placeholder !== undefined) {
            select.append(this.buildPlaceholderOption(String(placeholder)));
        }

        for (const item of data) {
            select.append(
                'children' in item
                    ? this.buildGroup(item as SelectSourceGroup)
                    : this.buildOption(item as SelectSourceItem),
            );
        }
    }

    private buildPlaceholderOption(text: string): HTMLOptionElement {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = text;
        option.disabled = true;
        return option;
    }

    private buildGroup(group: SelectSourceGroup): HTMLOptGroupElement {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.text;
        for (const child of group.children) {
            optgroup.append(this.buildOption(child));
        }
        return optgroup;
    }

    private buildOption(item: SelectSourceItem): HTMLOptionElement {
        const option = document.createElement('option');
        option.value = String(item.value);
        option.textContent = item.text;
        option.disabled = Boolean(item.disabled);
        return option;
    }
}
