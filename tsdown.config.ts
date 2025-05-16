import { defineConfig } from 'tsdown'

export default defineConfig({
  format: [
    'esm',
  ],
  target: 'node18',
  dts: true,
  clean: true,
  shims: false,
  external: [
    /@slidev/,
  ],
})
