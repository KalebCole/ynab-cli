import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  shims: false,
  outDir: 'dist',
  dts: false,
  sourcemap: true,
  minify: false,
});
