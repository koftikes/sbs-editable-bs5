import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import BaseType from './BaseType.js';

dayjs.extend(customParseFormat);

export default class DateType extends BaseType {
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
            this.context.element.textContent = dayjs(value, this.context.options.format).format(
                this.context.options.displayFormat,
            );
            return false;
        }
    }

    initOptions(): void {
        const default_format = 'YYYY-MM-DD';
        const format = this.context.get_opt('format', default_format) as string;
        const displayFormat = this.context.get_opt('displayFormat', default_format) as string;
        this.context.setValue(dayjs(this.context.getValue(), displayFormat).format(format));
    }
}
