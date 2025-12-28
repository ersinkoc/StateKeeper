import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    minify: false,
    external: ['react', 'react-dom', 'vue', 'svelte'],
  },
  // Plugins entry
  {
    entry: ['src/plugins/index.ts'],
    outDir: 'dist/plugins',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    external: ['react', 'react-dom', 'vue', 'svelte'],
  },
  // React adapter
  {
    entry: ['src/adapters/react/index.ts'],
    outDir: 'dist/react',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },
  // Vue adapter
  {
    entry: ['src/adapters/vue/index.ts'],
    outDir: 'dist/vue',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    external: ['vue'],
  },
  // Svelte adapter
  {
    entry: ['src/adapters/svelte/index.ts'],
    outDir: 'dist/svelte',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    external: ['svelte', 'svelte/store'],
  },
])
