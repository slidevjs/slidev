import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
  formatters: {
    markdown: true,
    css: true,
    slidev: {
      files: [
        '**/slides.md',
        '**/template.md',
        '**/example.md',
        'test/fixtures/markdown/**/*.md',
        'packages/vscode/syntaxes/slidev.example.md',
      ],
    },
  },
  ignores: [
    'skills/**/*.md',
  ],
})
  .removeRules(
    'vue/no-v-text-v-html-on-component',
    'vue/component-name-in-template-casing',
    'jsonc/sort-array-values',
    'pnpm/yaml-no-duplicate-catalog-item',
  )
  .override('antfu/pnpm/package-json', {
    ignores: [
      'packages/create-theme/template/package.json',
      'packages/create-app/template/package.json',
      // VSCE and OVSX do not support pnpm catalog when reading `@types/vscode`'s version.
      'packages/vscode/package.json',
    ],
  })
  .remove('antfu/markdown/rules')
