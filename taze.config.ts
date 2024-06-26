import { defineConfig } from 'taze'

export default defineConfig({
  packageMode: {
    // v9 drops v18.0, we keep using v8 until we bump the deps
    'execa': 'minor',
    // See #1537
    'typeit': 'ignore',
    // `engines.vscode` must be updated when bumping `@types/vscode` version
    '@types/vscode': 'ignore',
  },
})
