import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import BaseType from './BaseType.js';

dayjs.extend(customParseFormat);

export default class DateType extends BaseType {
    checkUnsupportedOptions(): void {
        if (this.context.options.source !== undefined) {
            console.error(
                `${this.constructor.name} does not support the "source" option — it only applies to type: 'select'. It will be ignored.`,
            );
        }
    }

    create() {
        const input = this.createElement(`input`);
        input.type = 'date';

        return this.createContainer(input);
    }

    initText(): boolean {
        const value = this.context.getValue();
        if (value === '') {
            this.context.element.textContent = this.context.options.emptyText || '';
            return true;
        } else {
            const text = dayjs(value, this.context.options.format).format(this.context.options.displayFormat);
            this.context.element.textContent = this.context.options.render
                ? this.context.options.render(text, this.context)
                : text;
            return false;
        }
    }

    initOptions(): void {
        const default_format = 'YYYY-MM-DD';
        const format = this.context.get_opt('format', default_format) as string;
        const displayFormat = this.context.get_opt('displayFormat', default_format) as string;
        this.context.setValue(this.parseIncomingValue(format, displayFormat).format(format));
    }

    // `value` is normally given in displayFormat's shape (see initOptions), but a value read
    // back via getValue() from a live instance — e.g. destroy() + reconstruct — comes back
    // already in `format`'s shape instead, since that's what's stored internally. Try a strict
    // parse against `format` first so both round-trip cleanly; only fall back to displayFormat
    // (non-strict, since it's user-authored input) when that fails.
    protected parseIncomingValue(format: string, displayFormat: string): dayjs.Dayjs {
        const rawValue = this.context.getValue();
        const strict = dayjs(rawValue, format, true);
        return strict.isValid() ? strict : dayjs(rawValue, displayFormat);
    }
}
