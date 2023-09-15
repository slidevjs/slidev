import { defineConfig } from 'tsup'

export default defineConfig({
  format: [
    'esm',
    'cjs',
  ],
  target: 'node18',
  splitting: true,
  dts: true,
  clean: true,
  shims: false,
  external: [
    /@slidev/,
  ],
})
