import BaseType from './BaseType.js';

export default class InputType extends BaseType {
    create() {
        const input = this.createElement(`input`);
        const { options = {} } = this.context;

        input.type = typeof options.type === 'string' ? options.type : 'text';

        return this.createContainer(input);
    }
}
