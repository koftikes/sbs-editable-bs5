import Editable from '../src/editable.ts';

const consoleEl = document.getElementById('console');

function logToConsole(lines) {
    consoleEl.value = `${lines.join('\n')}\n${'-'.repeat(40)}\n\n${consoleEl.value}`;
}

function attachLogging(el) {
    ['init', 'show', 'shown', 'hide', 'hidden', 'save'].forEach((evt) => {
        el.addEventListener(evt, (e) => {
            const lines = [`EVENT ${evt} — #${el.id}`];
            if (evt === 'save') lines.push(`value = ${JSON.stringify(e.detail.Editable.getValue())}`);
            logToConsole(lines);
        });
    });
}

// Every fetch the library makes gets logged here, x-editable-console style — all of them fail,
// since no backend is running.
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const lines = [`${(init.method || 'GET').toUpperCase()} url = "${url}"`];
    if (init.body) lines.push(`body = ${typeof init.body === 'string' ? init.body : '[FormData]'}`);
    try {
        const response = await nativeFetch(input, init);
        lines.push(`RESPONSE: status = ${response.status}`);
        logToConsole(lines);
        return response;
    } catch (error) {
        lines.push(`RESPONSE: ${error.message}`);
        logToConsole(lines);
        throw error;
    }
};

// Registry backing the global Settings controls (Mode / Refresh / Disable all) — every demo
// widget is registered here so those controls can act on all of them uniformly.
let globalMode = 'popup';
const registry = [];

function createInstance(el, options) {
    return new Editable(el, { ...options, mode: globalMode });
}

function register(el, options = {}) {
    attachLogging(el);
    const entry = { el, baseOptions: options, instance: createInstance(el, options) };
    registry.push(entry);
    return entry;
}

// --- Text ---
register(document.getElementById('text-popup'));
register(document.getElementById('email'));
register(document.getElementById('auto-submit'));
register(document.getElementById('attr-disabled'), { type: 'text', attributes: { disabled: true } });
register(document.getElementById('empty'));

// --- Textarea ---
register(document.getElementById('textarea'));

// --- Number ---
register(document.getElementById('number'), {
    type: 'number',
    title: 'Enter number',
    value: '30000.00',
    render: (value) => {
        const [integer, decimals] = parseFloat(value).toFixed(2).split('.');
        const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return `${grouped}.${decimals}`;
    },
    attributes: {
        placeholder: 'Enter number',
        min: 0.1,
        max: 5000000,
        step: 0.1,
        required: true,
    },
});

// --- Date & Datetime ---
register(document.getElementById('date'));
register(document.getElementById('datetime'));
register(document.getElementById('date-format'), {
    type: 'date',
    title: 'Pick a date',
    value: '18.09.2026',
    displayFormat: 'DD.MM.YYYY',
});

// --- Select ---
register(document.getElementById('select-strings'));
register(document.getElementById('select'), {
    type: 'select',
    title: 'Choose status',
    value: '2',
    source: [
        { value: '1', text: 'Draft' },
        { value: '2', text: 'Published' },
        { value: '3', text: 'Archived' },
    ],
});
register(document.getElementById('select-map'), {
    type: 'select',
    title: 'Pick one',
    value: '2',
    source: { 1: 'Draft', 2: 'Published', 3: 'Archived' },
});
register(document.getElementById('select-groups'), {
    type: 'select',
    title: 'Pick a status',
    value: '2',
    source: [
        {
            text: 'Active states',
            children: [
                { value: '1', text: 'Draft' },
                { value: '2', text: 'Published' },
            ],
        },
        { value: '3', text: 'Archived', disabled: true },
    ],
});
register(document.getElementById('select-fn-sync'), {
    type: 'select',
    title: 'Pick one',
    value: '2',
    source: () => [
        { value: '1', text: 'Draft' },
        { value: '2', text: 'Published' },
    ],
});
register(document.getElementById('select-fn-async'), {
    type: 'select',
    title: 'Loads after 1.5s',
    value: '2',
    source: () =>
        new Promise((resolve) => {
            setTimeout(
                () =>
                    resolve([
                        { value: '1', text: 'Draft' },
                        { value: '2', text: 'Published' },
                    ]),
                1500,
            );
        }),
});
register(document.getElementById('select-fn-error'), {
    type: 'select',
    title: 'Open me — the source always fails after 1s',
    source: () =>
        new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('Failed to load options')), 1000);
        }),
});
['select-ajax-a', 'select-ajax-b'].forEach((id) => {
    register(document.getElementById(id), {
        type: 'select',
        title: 'Shared source (see Network tab)',
        source: '/api/select-options',
    });
});
register(document.getElementById('select-placeholder'), {
    type: 'select',
    title: 'Pick a status',
    required: true,
    attributes: { placeholder: 'Select a Value' },
    source: [
        { value: '1', text: 'Draft' },
        { value: '2', text: 'Published' },
    ],
});

// --- Autocomplete ---
const USERS = [
    { value: '42', text: 'Alice Johnson' },
    { value: '17', text: 'Bob Smith' },
    { value: '9', text: 'Bobby Fischer' },
];
register(document.getElementById('ac-strict'), {
    type: 'autocomplete',
    title: 'Assign to user',
    value: '42',
    source: USERS,
});
register(document.getElementById('ac-exact'), {
    type: 'autocomplete',
    title: 'Type "Bob Smith" by hand, then Save',
    value: '42',
    source: USERS,
});
register(document.getElementById('ac-custom'), {
    type: 'autocomplete',
    title: 'City',
    value: 'Berlin',
    allowCustomValue: true,
    source: ['Berlin', 'Bern', 'Belgrade', 'Bern (Switzerland)'],
});
register(document.getElementById('ac-async'), {
    type: 'autocomplete',
    title: 'Loads after 1.5s',
    value: '17',
    source: () =>
        new Promise((resolve) => {
            setTimeout(() => resolve(USERS), 1500);
        }),
});
register(document.getElementById('ac-tuned'), {
    type: 'autocomplete',
    title: 'threshold: 1, maxItems: 3',
    value: '9',
    source: USERS,
    threshold: 1,
    maxItems: 3,
});

// --- Custom type ---
class RatingType extends Editable.BaseType {
    create() {
        const select = this.createElement('select');
        [1, 2, 3, 4, 5].forEach((n) => {
            const opt = document.createElement('option');
            opt.value = String(n);
            opt.textContent = '★'.repeat(n);
            select.append(opt);
        });
        return this.createContainer(select);
    }
}
Editable.registerType('rating', RatingType);
register(document.getElementById('custom'), { type: 'rating', title: 'Pick a rating', value: '3' });

// --- Networking ---
register(document.getElementById('ajax-demo'));
register(document.getElementById('ajax-fn-demo'), {
    url: (ctx, newValue) => `/api/records/${ctx.element.dataset.recordId}?value=${encodeURIComponent(newValue)}`,
});
register(document.getElementById('ajax-rb-demo'), {
    url: '/api/rb-demo',
    requestBuilder: (_ctx, _newValue, url) => ({
        url,
        init: {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue }),
        },
    }),
});

// --- Lifecycle ---
const destroyEntry = register(document.getElementById('destroy-me'));
document.getElementById('destroy-btn').addEventListener('click', () => {
    destroyEntry.instance.destroy();
    logToConsole([`destroy() called — #${destroyEntry.el.id}`]);
});

// --- Global Settings controls ---
document.querySelectorAll('input[name="global-mode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
        if (!radio.checked) return;
        globalMode = radio.value;
        registry.forEach((entry) => {
            const value = entry.instance.getValue();
            entry.instance.destroy();
            entry.instance = createInstance(entry.el, { ...entry.baseOptions, value });
        });
    });
});

document.getElementById('refresh-btn').addEventListener('click', () => {
    location.reload();
});

document.getElementById('disable-all').addEventListener('change', (e) => {
    registry.forEach((entry) => {
        if (e.target.checked) {
            entry.instance.disable();
        } else {
            entry.instance.enable();
        }
    });
});
