import { defineConfig } from 'tsup'

export default defineConfig({
  format: [
    'esm',
    'cjs',
  ],
  target: 'node16',
  splitting: true,
  dts: true,
  clean: true,
  shims: false,
  external: [
    /@slidev/,
  ],
})
