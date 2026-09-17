import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
      libInjectCss(),
      dts(),
  ],
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
        }
      }
    },
    sourcemap: true
  },
});