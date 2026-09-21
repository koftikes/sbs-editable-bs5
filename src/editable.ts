import './editable.css';
import type Options from './Interfaces/Options.ts';
import type { SelectSourceData, SelectSourceGroup, SelectSourceItem } from './Interfaces/Options.ts';
import BaseMode from './Modes/BaseMode.ts';
import InlineMode from './Modes/InlineMode.ts';
import PopupMode from './Modes/PopupMode.ts';
import AutocompleteType from './Types/AutocompleteType.ts';
import BaseType from './Types/BaseType.ts';
import DateTimeType from './Types/DateTimeType.ts';
import DateType from './Types/DateType.ts';
import InputType from './Types/InputType.ts';
import ListType from './Types/ListType.ts';
import SelectType from './Types/SelectType.ts';
import TextAreaType from './Types/TextAreaType.ts';

export type { Options, SelectSourceData, SelectSourceGroup, SelectSourceItem };

export default class Editable {
    static BaseType = BaseType;
    static ListType = ListType;
    static BaseMode = BaseMode;
    static InputType = InputType;
    static TextAreaType = TextAreaType;
    static SelectType = SelectType;
    static AutocompleteType = AutocompleteType;
    static DateType = DateType;
    static DateTimeType = DateTimeType;
    static PopupMode = PopupMode;
    static InlineMode = InlineMode;

    static types: Map<string, typeof BaseType> = new Map<string, typeof BaseType>([
        ['text', InputType],
        ['password', InputType],
        ['email', InputType],
        ['url', InputType],
        ['tel', InputType],
        ['number', InputType],
        ['range', InputType],
        ['time', InputType],
        ['textarea', TextAreaType],
        ['select', SelectType],
        ['autocomplete', AutocompleteType],
        ['date', DateType],
        ['datetime', DateTimeType],
    ]);

    static modes: Map<string, typeof BaseMode> = new Map<string, typeof BaseMode>([
        ['popup', PopupMode],
        ['inline', InlineMode],
    ]);

    static registerType(name: string, type: typeof BaseType): void {
        Editable.types.set(name, type);
    }

    static registerMode(name: string, mode: typeof BaseMode): void {
        Editable.modes.set(name, mode);
    }

    element: HTMLElement;
    options: Options;

    typeElement: BaseType;
    modeElement: BaseMode;

    private accessibilityAbortController = new AbortController();

    constructor(element: HTMLElement, options: Options = {}) {
        this.element = element;
        this.options = { ...options };
        this.init_options();
        this.typeElement = this.route_type();
        this.typeElement.checkUnsupportedOptions();
        this.typeElement.initOptions();
        this.modeElement = this.route_mode();
        this.modeElement.init();
        this.init_text();
        this.init_style();
        this.init_accessibility();
        if (Editable.isNativelyDisabled(this.element)) {
            this.disable();
        }
        this.element.dispatchEvent(new CustomEvent('init', { detail: { Editable: this } }));
    }

    private static readonly DISABLED_FALSY_VALUES = new Set(['false', '0']);

    // The native `disabled` attribute on the trigger element itself (no `data-` prefix) —
    // distinct from `options.attributes.disabled`, which targets the generated input.
    // Bare `disabled`/`disabled=""` has no value to coerce, so native HTML boolean-attribute
    // semantics apply (presence alone means true); only an explicit falsy value opts out.
    private static isNativelyDisabled(el: HTMLElement): boolean {
        if (!el.hasAttribute('disabled')) return false;
        const value = (el.getAttribute('disabled') ?? '').trim().toLowerCase();
        return !Editable.DISABLED_FALSY_VALUES.has(value);
    }

    // Options has no index signature by design (keeps the public shape autocomplete-friendly),
    // so these two helpers are the only place that reads/writes it dynamically by name.
    private readOption(name: string): unknown {
        // @ts-expect-error
        return this.options[name];
    }

    private writeOption(name: string, value: unknown): void {
        // @ts-expect-error
        this.options[name] = value;
    }

    get_opt(name: string, default_value: unknown): unknown {
        const value = this.element.dataset?.[name] ?? this.readOption(name) ?? default_value;
        this.writeOption(name, value);
        return value;
    }

    get_opt_object(name: string, default_value: unknown): void {
        // Object-valued options are JS-only — dataset is deliberately not read here
        this.writeOption(name, this.readOption(name) ?? default_value);
    }

    get_opt_bool(name: string, default_value: boolean): void {
        this.get_opt(name, default_value);
        if (typeof this.readOption(name) !== 'boolean') {
            if (this.readOption(name) === 'true') {
                this.writeOption(name, true);
                return;
            }
            if (this.readOption(name) === 'false') {
                this.writeOption(name, false);
                return;
            }
            this.writeOption(name, default_value);
        }
    }

    init_options(): void {
        //priority date elements
        const seedText = this.element.textContent ?? '';
        // Markup often fills an otherwise-empty trigger with `&nbsp;` just to keep it visible/
        // clickable before init (see demo/index.html) — treat that as no initial value rather
        // than seeding it verbatim, or it silently fails to match a select's `value=""`
        // placeholder option (U+00A0 !== '').
        const isBlankSeed = seedText.replace(/ /g, ' ').trim() === '';
        this.get_opt('value', isBlankSeed ? '' : seedText);
        this.get_opt('name', this.element.id || 'value');
        this.get_opt('title', '');
        this.get_opt('type', 'text');
        this.get_opt('emptyText', 'N/A');
        this.get_opt('mode', 'popup');
        this.get_opt('url', null);
        this.get_opt_object('ajaxOptions', {});
        this.options.ajaxOptions = Object.assign({ method: 'POST' }, this.options.ajaxOptions);
        this.get_opt_bool('required', false);
        this.get_opt_bool('showButtons', true);
        if (this.options?.success && typeof this.options?.success === 'function') {
            this.success = this.options.success;
        }
        if (this.options?.error && typeof this.options?.error === 'function') {
            this.error = this.options.error;
        }
        this.get_opt_object('attributes', {});
        this.get_opt_object('popoverOptions', {});
    }

    init_text() {
        const empty_class = 'editable-element-empty';
        this.element.classList.remove(empty_class);
        if (this.typeElement.initText()) {
            this.element.classList.add(empty_class);
        }
    }

    init_style() {
        this.element.classList.add('editable-element');
    }

    // The trigger has no native keyboard semantics unless the host already made it one
    // (a real <button> or <a href>) — give it button-like tabbing and Enter/Space activation
    // otherwise. Guarded to the element itself so keys typed into an open inline-mode input,
    // which lives inside this same element, don't re-trigger it.
    init_accessibility(): void {
        const el = this.element;
        const isNativelyInteractive =
            el.tagName === 'BUTTON' ||
            el.tagName === 'INPUT' ||
            el.tagName === 'SELECT' ||
            el.tagName === 'TEXTAREA' ||
            (el.tagName === 'A' && el.hasAttribute('href'));
        if (isNativelyInteractive) return;

        if (!el.hasAttribute('tabindex')) {
            el.tabIndex = 0;
        }
        if (!el.hasAttribute('role')) {
            el.setAttribute('role', 'button');
        }
        el.addEventListener(
            'keydown',
            (e) => {
                if (e.target !== el) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            },
            { signal: this.accessibilityAbortController.signal },
        );
    }

    route_mode(): BaseMode {
        const ModeClass = Editable.modes.get(this.options.mode as string);
        if (!ModeClass) {
            throw new Error(
                `Mode "${this.options.mode}" is not registered. Available modes: ${[...Editable.modes.keys()].join(', ')}. Register custom modes via Editable.registerMode(name, ModeClass).`,
            );
        }
        return new ModeClass(this);
    }

    route_type(): BaseType {
        if (this.options.type && typeof this.options.type !== 'string') {
            // @ts-expect-error
            return new this.options.type(this);
        }
        const TypeClass = Editable.types.get(this.options.type as string);
        if (!TypeClass) {
            throw new Error(
                `Type "${this.options.type}" is not registered. Available types: ${[...Editable.types.keys()].join(', ')}. Register custom types via Editable.registerType(name, TypeClass).`,
            );
        }
        return new TypeClass(this);
    }

    async success(response: Response, newValue: string): Promise<string | undefined> {
        return await this.typeElement.successResponse(response, newValue);
    }

    async error(response: Response, newValue: string): Promise<string | undefined> {
        return await this.typeElement.errorResponse(response, newValue);
    }

    enable(): void {
        this.element.classList.remove('editable-element-disabled');
        this.modeElement.enable();
    }

    disable(): void {
        this.element.classList.add('editable-element-disabled');
        this.modeElement.disable();
    }

    setValue(value: string): void {
        this.options.value = value;
        this.init_text();
    }

    getValue(): string {
        return this.options.value ?? '';
    }

    getOption(name: string): unknown {
        return this.readOption(name) ?? null;
    }

    destroy(): void {
        this.accessibilityAbortController.abort();
        this.modeElement.destroy();
        this.element.classList.remove('editable-element', 'editable-element-disabled', 'editable-element-empty');
    }
}
