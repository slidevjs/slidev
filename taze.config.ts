import { defineConfig } from 'taze'

export default defineConfig({
  packageMode: {
    codemirror: 'minor',
    // v9 drops v18.0, we keep using v8 until we bump the deps
    execa: 'minor',
    // See #1537
    typeit: 'ignore',
  },
})
