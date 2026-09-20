import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
    plugins: [libInjectCss(), dts()],
    server: {
        open: '/demo/index.html',
    },
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: './src/editable.ts',
            name: 'Editable',
            // the proper extensions will be added
            fileName: 'editable',
            formats: ['es', 'iife', 'umd'],
        },
        rollupOptions: {
            external: ['bootstrap'],
            output: {
                globals: {
                    bootstrap: 'bootstrap',
                },
            },
        },
        sourcemap: true,
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
        },
    },
});
