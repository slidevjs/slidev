import { defineConfig } from 'taze'

export default defineConfig({
  packageMode: {
    // See #1537
    'typeit': 'ignore',
    // `engines.vscode` must be updated when bumping `@types/vscode` version
    '@types/vscode': 'ignore',
  },
})
