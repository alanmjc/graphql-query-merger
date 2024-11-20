import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'graphql-query-merger',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['graphql'],
      output: {
        globals: {
          graphql: 'graphql',
        },
      },
    },
    minify: true,
  },
});
