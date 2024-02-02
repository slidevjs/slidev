import { defineConfig } from 'taze'

export default defineConfig({
  exclude: [
    'cypress',
  ],
  packageMode: {
    'codemirror': 'minor',
    'monaco-editor': 'minor',
  },
})
