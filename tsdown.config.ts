import { defineConfig } from 'tsdown'

export default defineConfig({
  format: [
    'esm',
  ],
  target: 'node20',
  dts: true,
  clean: true,
  shims: false,
  external: [
    /@slidev/,
  ],
})
