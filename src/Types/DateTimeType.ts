import DateType from "./DateType.js";
import dayjs from "dayjs";

export default class DateTimeType extends DateType{
    create(){
        const input = this.createElement(`input`);
        input.type = "datetime-local";

        return this.createContainer(input);
    }

    initOptions(): void
    {
        const default_format = "YYYY-MM-DDTHH:mm";
        const format = this.context.get_opt("format", default_format);
        const displayFormat = this.context.get_opt("displayFormat", default_format);
        this.context.setValue(dayjs(this.context.getValue(), displayFormat).format(format));
    }
}
